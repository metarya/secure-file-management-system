package com.project.filemanagement.service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.project.filemanagement.dto.AdminUserStorageResponse;
import com.project.filemanagement.dto.StorageConnectionTestResponse;
import com.project.filemanagement.dto.StorageSettingsResponse;
import com.project.filemanagement.dto.UpdateStorageSettingsRequest;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserStorageSettings;
import com.project.filemanagement.repository.UserStorageSettingsRepository;
import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageModels.ConnectionTestResult;
import com.project.filemanagement.storage.StorageProviderRegistry;
import com.project.filemanagement.storage.StorageProviderType;

/**
 * Manages each user's independent storage configuration: persistence (with
 * encrypted secrets), the non-secret view for the UI, connection testing, and
 * resolving a ready-to-use {@link StorageContext} for the file pipeline.
 *
 * <p>Secrets are encrypted on write via {@link CredentialEncryptionService} and
 * decrypted only transiently when building a context or testing a connection —
 * they are never placed in a response DTO.
 */
@Service
public class UserStorageSettingsService {

    private final UserStorageSettingsRepository repository;
    private final CredentialEncryptionService encryption;
    private final StorageProviderRegistry registry;
    private final ActivityLogService activityLogService;

    public UserStorageSettingsService(
            UserStorageSettingsRepository repository,
            CredentialEncryptionService encryption,
            StorageProviderRegistry registry,
            ActivityLogService activityLogService
    ) {
        this.repository = repository;
        this.encryption = encryption;
        this.registry = registry;
        this.activityLogService = activityLogService;
    }

    // ----------------------------------------------------------------------
    // Read
    // ----------------------------------------------------------------------

    public StorageSettingsResponse getSettings(User user) {
        UserStorageSettings s = repository.findByUserId(user.getId()).orElse(null);

        if (s == null) {
            return new StorageSettingsResponse(
                    StorageProviderType.LOCAL.name(),
                    supportedProviders(),
                    null, null, null, false, null, false, null, false,
                    null, null, null, null, false);
        }

        return new StorageSettingsResponse(
                s.getDefaultProvider() == null ? StorageProviderType.LOCAL.name() : s.getDefaultProvider(),
                supportedProviders(),
                s.getLocalDirectory(),
                s.getS3Bucket(),
                s.getS3Region(),
                notBlank(s.getS3AccessKeyEnc()) && notBlank(s.getS3SecretKeyEnc()),
                s.getGdriveClientId(),
                notBlank(s.getGdriveRefreshTokenEnc()),
                s.getOnedriveClientId(),
                notBlank(s.getOnedriveRefreshTokenEnc()),
                s.getSftpHost(),
                s.getSftpPort(),
                s.getSftpUsername(),
                s.getSftpRemoteDir(),
                notBlank(s.getSftpHost()) && notBlank(s.getSftpPasswordEnc()));
    }

    /** The provider a user's NEW uploads should use (default LOCAL). */
    public StorageProviderType resolveProviderType(User user) {
        return repository.findByUserId(user.getId())
                .map(s -> StorageProviderType.fromString(s.getDefaultProvider()))
                .orElse(StorageProviderType.LOCAL);
    }

    private static List<String> supportedProviders() {
        return List.of(
                StorageProviderType.LOCAL.name(),
                StorageProviderType.S3.name(),
                StorageProviderType.GOOGLE_DRIVE.name(),
                StorageProviderType.ONEDRIVE.name(),
                StorageProviderType.SFTP.name());
    }

    // ----------------------------------------------------------------------
    // Write
    // ----------------------------------------------------------------------

    public StorageSettingsResponse updateSettings(User user, UpdateStorageSettingsRequest req) {
        UserStorageSettings s = repository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserStorageSettings fresh = new UserStorageSettings();
                    fresh.setUserId(user.getId());
                    return fresh;
                });

        // Capture the provider in effect BEFORE this save so we can detect a change.
        String providerBefore = s.getDefaultProvider() == null ? StorageProviderType.LOCAL.name() : s.getDefaultProvider();

        if (notBlank(req.getDefaultProvider())) {
            // Validate against the enum (falls back to LOCAL on unknown values).
            s.setDefaultProvider(StorageProviderType.fromString(req.getDefaultProvider()).name());
        }

        s.setLocalDirectory(req.getLocalDirectory());

        s.setS3Bucket(req.getS3Bucket());
        s.setS3Region(req.getS3Region());
        s.setS3AccessKeyEnc(keepOrEncrypt(req.getS3AccessKey(), s.getS3AccessKeyEnc()));
        s.setS3SecretKeyEnc(keepOrEncrypt(req.getS3SecretKey(), s.getS3SecretKeyEnc()));

        s.setGdriveClientId(req.getGoogleClientId());
        s.setGdriveClientSecretEnc(keepOrEncrypt(req.getGoogleClientSecret(), s.getGdriveClientSecretEnc()));
        s.setGdriveRefreshTokenEnc(keepOrEncrypt(req.getGoogleRefreshToken(), s.getGdriveRefreshTokenEnc()));

        s.setOnedriveClientId(req.getOneDriveClientId());
        s.setOnedriveClientSecretEnc(keepOrEncrypt(req.getOneDriveClientSecret(), s.getOnedriveClientSecretEnc()));
        s.setOnedriveRefreshTokenEnc(keepOrEncrypt(req.getOneDriveRefreshToken(), s.getOnedriveRefreshTokenEnc()));

        s.setSftpHost(req.getSftpHost());
        s.setSftpPort(req.getSftpPort());
        s.setSftpUsername(req.getSftpUsername());
        s.setSftpPasswordEnc(keepOrEncrypt(req.getSftpPassword(), s.getSftpPasswordEnc()));
        s.setSftpRemoteDir(req.getSftpRemoteDir());

        s.setUpdatedAt(LocalDateTime.now());
        repository.save(s);

        // Audit: one event per save — either a provider switch or a config-only update.
        String providerAfter = s.getDefaultProvider();
        if (!providerBefore.equalsIgnoreCase(providerAfter)) {
            activityLogService.log(
                    user,
                    ActivityLogService.ACTION_STORAGE_PROVIDER_CHANGED,
                    ActivityLogService.RESOURCE_STORAGE,
                    null,
                    providerLabel(providerBefore) + " → " + providerLabel(providerAfter),
                    ActivityLogService.SUCCESS,
                    null, null,
                    "Provider switched from " + providerBefore + " to " + providerAfter
            );
        } else {
            activityLogService.log(
                    user,
                    ActivityLogService.ACTION_STORAGE_SETTINGS_UPDATED,
                    ActivityLogService.RESOURCE_STORAGE,
                    null,
                    providerLabel(providerAfter),
                    ActivityLogService.SUCCESS,
                    null, null,
                    "Configuration updated for provider: " + providerAfter
            );
        }

        return getSettings(user);
    }

    /** Encrypt a newly-supplied secret; keep the existing ciphertext when blank. */
    private String keepOrEncrypt(String incomingPlaintext, String existingCipher) {
        if (incomingPlaintext == null || incomingPlaintext.isBlank()) {
            return existingCipher;
        }
        return encryption.encrypt(incomingPlaintext);
    }

    // ----------------------------------------------------------------------
    // Context building (decrypted, transient)
    // ----------------------------------------------------------------------

    /** Builds a ready-to-use context from the user's SAVED settings. */
    public StorageContext contextFor(User user, StorageProviderType type) {
        UserStorageSettings s = repository.findByUserId(user.getId()).orElse(null);
        Map<String, String> settings = new HashMap<>();

        if (s != null) {
            switch (type) {
                case LOCAL -> settings.put("directory", s.getLocalDirectory());
                case S3 -> {
                    settings.put("bucket", s.getS3Bucket());
                    settings.put("region", s.getS3Region());
                    settings.put("accessKey", encryption.decrypt(s.getS3AccessKeyEnc()));
                    settings.put("secretKey", encryption.decrypt(s.getS3SecretKeyEnc()));
                }
                case GOOGLE_DRIVE -> {
                    settings.put("clientId", s.getGdriveClientId());
                    settings.put("clientSecret", encryption.decrypt(s.getGdriveClientSecretEnc()));
                    settings.put("refreshToken", encryption.decrypt(s.getGdriveRefreshTokenEnc()));
                }
                case ONEDRIVE -> {
                    settings.put("clientId", s.getOnedriveClientId());
                    settings.put("clientSecret", encryption.decrypt(s.getOnedriveClientSecretEnc()));
                    settings.put("refreshToken", encryption.decrypt(s.getOnedriveRefreshTokenEnc()));
                }
                case SFTP -> {
                    settings.put("host", s.getSftpHost());
                    settings.put("port", s.getSftpPort());
                    settings.put("username", s.getSftpUsername());
                    settings.put("password", encryption.decrypt(s.getSftpPasswordEnc()));
                    settings.put("remoteDir", s.getSftpRemoteDir());
                }
            }
        }
        return new StorageContext(user.getEmail(), type, settings);
    }

    // ----------------------------------------------------------------------
    // Connection test
    // ----------------------------------------------------------------------

    /**
     * Tests a provider connection BEFORE saving. Uses the values in the request
     * (so newly-typed secrets are honoured), falling back to saved values for
     * any secret left blank.
     */
    public StorageConnectionTestResponse testConnection(User user, UpdateStorageSettingsRequest req) {
        StorageProviderType type = StorageProviderType.fromString(req.getDefaultProvider());
        UserStorageSettings saved = repository.findByUserId(user.getId()).orElse(null);
        Map<String, String> settings = new HashMap<>();

        switch (type) {
            case LOCAL -> settings.put("directory", req.getLocalDirectory());
            case S3 -> {
                settings.put("bucket", req.getS3Bucket());
                settings.put("region", req.getS3Region());
                settings.put("accessKey", firstNonBlank(req.getS3AccessKey(),
                        saved == null ? null : encryption.decrypt(saved.getS3AccessKeyEnc())));
                settings.put("secretKey", firstNonBlank(req.getS3SecretKey(),
                        saved == null ? null : encryption.decrypt(saved.getS3SecretKeyEnc())));
            }
            case GOOGLE_DRIVE -> {
                settings.put("clientId", firstNonBlank(req.getGoogleClientId(), saved == null ? null : saved.getGdriveClientId()));
                settings.put("clientSecret", firstNonBlank(req.getGoogleClientSecret(),
                        saved == null ? null : encryption.decrypt(saved.getGdriveClientSecretEnc())));
                settings.put("refreshToken", firstNonBlank(req.getGoogleRefreshToken(),
                        saved == null ? null : encryption.decrypt(saved.getGdriveRefreshTokenEnc())));
            }
            case ONEDRIVE -> {
                settings.put("clientId", firstNonBlank(req.getOneDriveClientId(), saved == null ? null : saved.getOnedriveClientId()));
                settings.put("clientSecret", firstNonBlank(req.getOneDriveClientSecret(),
                        saved == null ? null : encryption.decrypt(saved.getOnedriveClientSecretEnc())));
                settings.put("refreshToken", firstNonBlank(req.getOneDriveRefreshToken(),
                        saved == null ? null : encryption.decrypt(saved.getOnedriveRefreshTokenEnc())));
            }
            case SFTP -> {
                settings.put("host", firstNonBlank(req.getSftpHost(), saved == null ? null : saved.getSftpHost()));
                settings.put("port", firstNonBlank(req.getSftpPort(), saved == null ? null : saved.getSftpPort()));
                settings.put("username", firstNonBlank(req.getSftpUsername(), saved == null ? null : saved.getSftpUsername()));
                settings.put("password", firstNonBlank(req.getSftpPassword(),
                        saved == null ? null : encryption.decrypt(saved.getSftpPasswordEnc())));
                settings.put("remoteDir", firstNonBlank(req.getSftpRemoteDir(), saved == null ? null : saved.getSftpRemoteDir()));
            }
        }

        ConnectionTestResult result = registry.get(type)
                .testConnection(new StorageContext(user.getEmail(), type, settings));

        // Audit: one event per test attempt, whether it succeeded or failed.
        String testStatus = result.success() ? ActivityLogService.SUCCESS : ActivityLogService.FAILURE;
        String testDesc = result.success()
                ? providerLabel(type.name()) + ": " + result.message()
                : providerLabel(type.name()) + ": " + result.message();
        activityLogService.log(
                user,
                ActivityLogService.ACTION_STORAGE_CONNECTION_TEST,
                ActivityLogService.RESOURCE_STORAGE,
                null,
                testDesc,
                testStatus,
                null, null,
                result.message()
        );

        return new StorageConnectionTestResponse(result.success(), result.message());
    }

    // ----------------------------------------------------------------------
    // Admin (read/write)
    // ----------------------------------------------------------------------

    /**
     * Changes a user's default storage provider on behalf of an administrator.
     * Only the provider pointer is changed; no files are migrated.
     *
     * @param adminEmail the authenticated admin's email (used for audit logging)
     * @return the updated provider name (enum string)
     */
    public String adminChangeUserStorageProvider(User targetUser, String newProviderRaw, String adminEmail) {
        StorageProviderType newProvider = StorageProviderType.fromString(newProviderRaw);

        UserStorageSettings s = repository.findByUserId(targetUser.getId())
                .orElseGet(() -> {
                    UserStorageSettings fresh = new UserStorageSettings();
                    fresh.setUserId(targetUser.getId());
                    return fresh;
                });

        String previousProvider = s.getDefaultProvider() == null
                ? StorageProviderType.LOCAL.name()
                : s.getDefaultProvider();

        s.setDefaultProvider(newProvider.name());
        s.setUpdatedAt(LocalDateTime.now());
        repository.save(s);

        activityLogService.logByEmail(
                adminEmail,
                ActivityLogService.ACTION_STORAGE_PROVIDER_CHANGED,
                ActivityLogService.RESOURCE_STORAGE,
                targetUser.getId(),
                targetUser.getEmail(),
                ActivityLogService.SUCCESS,
                previousProvider,
                newProvider.name(),
                "Admin " + adminEmail + " changed storage provider for user "
                        + targetUser.getEmail() + " from " + providerLabel(previousProvider)
                        + " to " + providerLabel(newProvider.name())
        );

        return newProvider.name();
    }

    /** Maps each user to their default provider for the admin overview. */
    public List<AdminUserStorageResponse> adminListUserStorage(List<User> users) {
        List<Long> ids = users.stream().map(User::getId).toList();
        Map<Long, String> byUser = repository.findByUserIdIn(ids).stream()
                .collect(Collectors.toMap(UserStorageSettings::getUserId,
                        x -> x.getDefaultProvider() == null ? StorageProviderType.LOCAL.name() : x.getDefaultProvider()));

        return users.stream()
                .map(u -> new AdminUserStorageResponse(
                        u.getId(), u.getFullName(), u.getEmail(),
                        byUser.getOrDefault(u.getId(), StorageProviderType.LOCAL.name())))
                .toList();
    }

    private static boolean notBlank(String v) {
        return v != null && !v.isBlank();
    }

    private static String firstNonBlank(String a, String b) {
        return notBlank(a) ? a : b;
    }

    /** Human-readable display name for a StorageProviderType name string. */
    private static String providerLabel(String providerName) {
        if (providerName == null) return "Local Storage";
        return switch (providerName.toUpperCase()) {
            case "LOCAL"        -> "Local Storage";
            case "S3"           -> "Amazon S3";
            case "GOOGLE_DRIVE" -> "Google Drive";
            case "ONEDRIVE"     -> "OneDrive";
            case "SFTP"         -> "SFTP";
            default             -> providerName;
        };
    }
}
