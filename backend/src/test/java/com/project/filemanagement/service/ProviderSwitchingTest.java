package com.project.filemanagement.service;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import com.project.filemanagement.dto.ActiveProviderResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserStorageSettings;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.repository.UserStorageSettingsRepository;
import com.project.filemanagement.storage.StorageProviderRegistry;
import com.project.filemanagement.storage.StorageProviderType;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for storage-provider switching: active provider CRUD, upload
 * routing, and file-list filtering by provider.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ProviderSwitchingTest {

    @Mock UserStorageSettingsRepository settingsRepo;
    @Mock CredentialEncryptionService encryption;
    @Mock StorageProviderRegistry registry;
    @Mock ActivityLogService activityLogService;
    @Mock FileRepository fileRepository;
    @Mock UserRepository userRepository;

    UserStorageSettingsService storageService;

    User user;

    @BeforeEach
    void setUp() {
        storageService = new UserStorageSettingsService(
                settingsRepo, encryption, registry, activityLogService);

        user = new User();
        user.setId(1L);
        user.setEmail("test@example.com");
    }

    // ------------------------------------------------------------------
    // getActiveProvider
    // ------------------------------------------------------------------

    @Test
    void getActiveProvider_noSettings_returnsLocalAsDefault() {
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.empty());

        ActiveProviderResponse res = storageService.getActiveProvider(user);

        assertEquals("LOCAL", res.getActiveProvider());
        assertEquals("LOCAL", res.getDefaultProvider());
        assertFalse(res.getAvailableProviders().isEmpty());
    }

    @Test
    void getActiveProvider_withActiveProvider_returnsActive() {
        UserStorageSettings s = settingsWithDefault("LOCAL");
        s.setActiveProvider("S3");
        // S3 credentials required for the guard in getActiveProvider() to pass.
        s.setS3Bucket("b"); s.setS3Region("r"); s.setS3AccessKeyEnc("a"); s.setS3SecretKeyEnc("k");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        ActiveProviderResponse res = storageService.getActiveProvider(user);

        assertEquals("S3", res.getActiveProvider());
        assertEquals("LOCAL", res.getDefaultProvider());
    }

    @Test
    void getActiveProvider_activeProviderNull_fallsBackToDefault() {
        UserStorageSettings s = settingsWithDefault("S3");
        s.setActiveProvider(null);
        // S3 credentials required so the fallback to defaultProvider ("S3") passes.
        s.setS3Bucket("b"); s.setS3Region("r"); s.setS3AccessKeyEnc("a"); s.setS3SecretKeyEnc("k");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        ActiveProviderResponse res = storageService.getActiveProvider(user);

        assertEquals("S3", res.getActiveProvider());
    }

    // ------------------------------------------------------------------
    // setActiveProvider
    // ------------------------------------------------------------------

    @Test
    void setActiveProvider_savesNewActiveProvider() {
        UserStorageSettings s = settingsWithDefault("LOCAL");
        // S3 credentials required so getActiveProvider() (called at the end of
        // setActiveProvider) returns "S3" rather than falling back to LOCAL.
        s.setS3Bucket("b"); s.setS3Region("r"); s.setS3AccessKeyEnc("a"); s.setS3SecretKeyEnc("k");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));
        when(settingsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ActiveProviderResponse res = storageService.setActiveProvider(user, "S3");

        assertEquals("S3", res.getActiveProvider());

        ArgumentCaptor<UserStorageSettings> captor = ArgumentCaptor.forClass(UserStorageSettings.class);
        verify(settingsRepo).save(captor.capture());
        assertEquals("S3", captor.getValue().getActiveProvider());
    }

    @Test
    void setActiveProvider_unknownProvider_defaultsToLocal() {
        UserStorageSettings s = settingsWithDefault("LOCAL");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));
        when(settingsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ActiveProviderResponse res = storageService.setActiveProvider(user, "NONEXISTENT");

        assertEquals("LOCAL", res.getActiveProvider());
    }

    @Test
    void setActiveProvider_createsSettingsWhenAbsent() {
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.empty());
        when(settingsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        storageService.setActiveProvider(user, "SFTP");

        ArgumentCaptor<UserStorageSettings> captor = ArgumentCaptor.forClass(UserStorageSettings.class);
        verify(settingsRepo).save(captor.capture());
        assertEquals("SFTP", captor.getValue().getActiveProvider());
    }

    // ------------------------------------------------------------------
    // resolveProviderType (upload routing)
    // ------------------------------------------------------------------

    @Test
    void resolveProviderType_activeProviderTakesPrecedenceOverDefault() {
        UserStorageSettings s = settingsWithDefault("LOCAL");
        s.setActiveProvider("S3");
        // S3 credentials required for the safety guard to let S3 through.
        s.setS3Bucket("b"); s.setS3Region("r"); s.setS3AccessKeyEnc("a"); s.setS3SecretKeyEnc("k");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        StorageProviderType resolved = storageService.resolveProviderType(user);

        assertEquals(StorageProviderType.S3, resolved);
    }

    @Test
    void resolveProviderType_noActiveProvider_usesDefault() {
        UserStorageSettings s = settingsWithDefault("SFTP");
        s.setActiveProvider(null);
        // SFTP credentials required for the safety guard to let SFTP through.
        s.setSftpHost("sftp.example.com"); s.setSftpPasswordEnc("enc-pw");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        StorageProviderType resolved = storageService.resolveProviderType(user);

        assertEquals(StorageProviderType.SFTP, resolved);
    }

    @Test
    void resolveProviderType_noSettings_returnsLocal() {
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.empty());

        assertEquals(StorageProviderType.LOCAL, storageService.resolveProviderType(user));
    }

    // ------------------------------------------------------------------
    // provider filtering in FileService (via service-level unit test)
    // ------------------------------------------------------------------

    @Test
    void getActiveProvider_noSettings_availableProvidersContainsOnlyLocal() {
        // With no settings saved the user has no cloud credentials, so only LOCAL is connected.
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.empty());

        ActiveProviderResponse res = storageService.getActiveProvider(user);

        List<String> providers = res.getAvailableProviders();
        assertEquals(List.of("LOCAL"), providers);
    }

    @Test
    void getActiveProvider_withAllProvidersConfigured_availableProvidersContainsAllFive() {
        UserStorageSettings s = settingsWithDefault("LOCAL");
        s.setS3Bucket("b"); s.setS3Region("r"); s.setS3AccessKeyEnc("a"); s.setS3SecretKeyEnc("k");
        s.setGdriveClientId("gc"); s.setGdriveRefreshTokenEnc("gr");
        s.setOnedriveClientId("oc"); s.setOnedriveRefreshTokenEnc("or");
        s.setSftpHost("h"); s.setSftpPasswordEnc("p");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        ActiveProviderResponse res = storageService.getActiveProvider(user);

        List<String> providers = res.getAvailableProviders();
        assertEquals(5, providers.size());
        assertTrue(providers.containsAll(List.of("LOCAL", "S3", "GOOGLE_DRIVE", "ONEDRIVE", "SFTP")));
    }

    @Test
    void getActiveProvider_withOnlyS3Configured_availableProvidersContainsLocalAndS3() {
        UserStorageSettings s = settingsWithDefault("LOCAL");
        s.setS3Bucket("b"); s.setS3Region("r"); s.setS3AccessKeyEnc("a"); s.setS3SecretKeyEnc("k");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        ActiveProviderResponse res = storageService.getActiveProvider(user);

        List<String> providers = res.getAvailableProviders();
        assertEquals(List.of("LOCAL", "S3"), providers);
    }

    @Test
    void getActiveProvider_withOnlyGoogleDriveConfigured_availableProvidersContainsLocalAndGoogleDrive() {
        UserStorageSettings s = settingsWithDefault("LOCAL");
        s.setGdriveClientId("gc"); s.setGdriveRefreshTokenEnc("gr");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        ActiveProviderResponse res = storageService.getActiveProvider(user);

        List<String> providers = res.getAvailableProviders();
        assertEquals(List.of("LOCAL", "GOOGLE_DRIVE"), providers);
    }

    // ------------------------------------------------------------------
    // Provider fallback — resolveProviderType safety guard
    // ------------------------------------------------------------------

    @Test
    void resolveProviderType_fallsBackToLocal_whenProviderNotConnected() {
        // Admin set defaultProvider = "S3" but user has no S3 credentials.
        UserStorageSettings s = settingsWithDefault("S3");
        // No S3 credentials set
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        StorageProviderType resolved = storageService.resolveProviderType(user);

        assertEquals(StorageProviderType.LOCAL, resolved,
                "resolveProviderType must fall back to LOCAL when the resolved provider has no credentials");
    }

    @Test
    void getActiveProvider_fallsBackToLocal_whenActiveProviderNotConnected() {
        // Admin set defaultProvider = "S3" but user has no S3 credentials.
        UserStorageSettings s = settingsWithDefault("S3");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        ActiveProviderResponse res = storageService.getActiveProvider(user);

        assertEquals("LOCAL", res.getActiveProvider(),
                "getActiveProvider must return LOCAL when the resolved active provider is not connected");
        // S3 must NOT appear in the available providers list.
        assertFalse(res.getAvailableProviders().contains("S3"));
    }

    @Test
    void adminChangeUserStorageProvider_throwsBadRequest_whenUserHasNoCredentials() {
        // User has no S3 credentials.
        UserStorageSettings s = settingsWithDefault("LOCAL");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));

        assertThrows(
                com.project.filemanagement.exception.BadRequestException.class,
                () -> storageService.adminChangeUserStorageProvider(user, "S3", "admin@test.com"),
                "adminChangeUserStorageProvider must reject switching to a provider with no credentials"
        );
    }

    @Test
    void adminChangeUserStorageProvider_succeedsForLocalAlways() {
        UserStorageSettings s = settingsWithDefault("S3");
        when(settingsRepo.findByUserId(1L)).thenReturn(Optional.of(s));
        when(settingsRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // LOCAL is always valid (no credentials needed).
        String result = storageService.adminChangeUserStorageProvider(user, "LOCAL", "admin@test.com");
        assertEquals("LOCAL", result);
    }

    // ------------------------------------------------------------------
    // helpers
    // ------------------------------------------------------------------

    private UserStorageSettings settingsWithDefault(String provider) {
        UserStorageSettings s = new UserStorageSettings();
        s.setUserId(1L);
        s.setDefaultProvider(provider);
        return s;
    }
}
