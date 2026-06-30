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

    public UserStorageSettingsService(
            UserStorageSettingsRepository repository,
            CredentialEncryptionService encryption,
            StorageProviderRegistry registry
    ) {
        this.repository = repository;
        this.encryption = encryption;
        this.registry = registry;
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
                    null, null, null, false, null, false, null, false);
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
                notBlank(s.getOnedriveRefreshTokenEnc()));
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
                StorageProviderType.ONEDRIVE.name());
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

        s.setUpdatedAt(LocalDateTime.now());
        repository.save(s);

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
        }

        ConnectionTestResult result = registry.get(type)
                .testConnection(new StorageContext(user.getEmail(), type, settings));
        return new StorageConnectionTestResponse(result.success(), result.message());
    }

    // ----------------------------------------------------------------------
    // Admin (read-only)
    // ----------------------------------------------------------------------

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
}
