package com.project.filemanagement.service;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import com.project.filemanagement.dto.StorageConnectionTestResponse;
import com.project.filemanagement.dto.StorageSettingsResponse;
import com.project.filemanagement.dto.UpdateStorageSettingsRequest;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserStorageSettings;
import com.project.filemanagement.repository.UserStorageSettingsRepository;
import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageModels.ConnectionTestResult;
import com.project.filemanagement.storage.StorageProvider;
import com.project.filemanagement.storage.StorageProviderRegistry;
import com.project.filemanagement.storage.StorageProviderType;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests verifying that storage-settings operations emit exactly the right
 * activity log entries. No real database — the repository and log service are
 * mocked so each test focuses purely on the logging contract.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StorageActivityLoggingTest {

    @Mock private UserStorageSettingsRepository repository;
    @Mock private CredentialEncryptionService encryption;
    @Mock private StorageProviderRegistry registry;
    @Mock private ActivityLogService activityLogService;
    @Mock private StorageProvider mockProvider;

    private UserStorageSettingsService service;

    private User user;

    @BeforeEach
    void setUp() {
        service = new UserStorageSettingsService(repository, encryption, registry, activityLogService);

        user = new User();
        user.setId(1L);
        user.setEmail("alice@example.com");
        user.setFullName("Alice");

        // Default: no stored settings yet → creates a fresh record.
        when(repository.findByUserId(1L)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private UpdateStorageSettingsRequest req(String provider) {
        UpdateStorageSettingsRequest r = new UpdateStorageSettingsRequest();
        r.setDefaultProvider(provider);
        return r;
    }

    private UserStorageSettings existingSettings(String provider) {
        UserStorageSettings s = new UserStorageSettings();
        s.setUserId(1L);
        s.setDefaultProvider(provider);
        return s;
    }

    // ------------------------------------------------------------------
    // 1. Provider change → STORAGE_PROVIDER_CHANGED (exactly once)
    // ------------------------------------------------------------------

    @Test
    void updateSettings_providerChange_logsStorageProviderChanged() {
        // User currently on LOCAL, switching to SFTP.
        when(repository.findByUserId(1L)).thenReturn(Optional.of(existingSettings("LOCAL")));

        service.updateSettings(user, req("SFTP"));

        ArgumentCaptor<String> actionCaptor = ArgumentCaptor.forClass(String.class);
        verify(activityLogService, times(1)).log(
                eq(user),
                actionCaptor.capture(),
                eq(ActivityLogService.RESOURCE_STORAGE),
                isNull(),
                argThat(name -> name.contains("Local Storage") && name.contains("SFTP")),
                eq(ActivityLogService.SUCCESS),
                isNull(), isNull(),
                anyString()
        );
        assertEquals(ActivityLogService.ACTION_STORAGE_PROVIDER_CHANGED, actionCaptor.getValue());
    }

    @Test
    void updateSettings_providerChange_resourceNameShowsOldArrowNew() {
        when(repository.findByUserId(1L)).thenReturn(Optional.of(existingSettings("S3")));
        UpdateStorageSettingsRequest r = req("GOOGLE_DRIVE");

        service.updateSettings(user, r);

        ArgumentCaptor<String> resourceCaptor = ArgumentCaptor.forClass(String.class);
        verify(activityLogService).log(
                eq(user), anyString(), anyString(), isNull(),
                resourceCaptor.capture(),
                anyString(), isNull(), isNull(), anyString()
        );
        assertEquals("Amazon S3 → Google Drive", resourceCaptor.getValue());
    }

    // ------------------------------------------------------------------
    // 2. Config-only update → STORAGE_SETTINGS_UPDATED (exactly once)
    // ------------------------------------------------------------------

    @Test
    void updateSettings_sameProvider_logsStorageSettingsUpdated() {
        when(repository.findByUserId(1L)).thenReturn(Optional.of(existingSettings("S3")));

        UpdateStorageSettingsRequest r = req("S3");
        r.setS3Bucket("my-new-bucket");
        r.setS3Region("eu-west-1");
        service.updateSettings(user, r);

        ArgumentCaptor<String> actionCaptor = ArgumentCaptor.forClass(String.class);
        verify(activityLogService, times(1)).log(
                eq(user),
                actionCaptor.capture(),
                eq(ActivityLogService.RESOURCE_STORAGE),
                isNull(),
                eq("Amazon S3"),
                eq(ActivityLogService.SUCCESS),
                isNull(), isNull(),
                anyString()
        );
        assertEquals(ActivityLogService.ACTION_STORAGE_SETTINGS_UPDATED, actionCaptor.getValue());
    }

    @Test
    void updateSettings_newUser_noExistingSettings_logsSettingsUpdated() {
        // First-time user — no existing row. Default is LOCAL, request is also LOCAL.
        service.updateSettings(user, req("LOCAL"));

        ArgumentCaptor<String> actionCaptor = ArgumentCaptor.forClass(String.class);
        verify(activityLogService, times(1)).log(
                eq(user), actionCaptor.capture(),
                eq(ActivityLogService.RESOURCE_STORAGE),
                isNull(), anyString(), anyString(),
                isNull(), isNull(), anyString()
        );
        // No change (LOCAL → LOCAL), so it's a settings update.
        assertEquals(ActivityLogService.ACTION_STORAGE_SETTINGS_UPDATED, actionCaptor.getValue());
    }

    // ------------------------------------------------------------------
    // 3. Test Connection → STORAGE_CONNECTION_TEST (exactly once)
    // ------------------------------------------------------------------

    @Test
    void testConnection_success_logsConnectionTestWithSuccessStatus() {
        when(registry.get(StorageProviderType.SFTP)).thenReturn(mockProvider);
        when(mockProvider.testConnection(any(StorageContext.class)))
                .thenReturn(ConnectionTestResult.ok("Connected to sftp.example.com:22 — directory verified."));
        when(encryption.decrypt(any())).thenReturn(null);

        UpdateStorageSettingsRequest r = new UpdateStorageSettingsRequest();
        r.setDefaultProvider("SFTP");
        r.setSftpHost("sftp.example.com");
        r.setSftpPort("22");
        r.setSftpUsername("user");
        r.setSftpPassword("pass");
        r.setSftpRemoteDir("/uploads");

        StorageConnectionTestResponse response = service.testConnection(user, r);

        assertTrue(response.success());

        ArgumentCaptor<String> actionCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> statusCaptor = ArgumentCaptor.forClass(String.class);
        verify(activityLogService, times(1)).log(
                eq(user),
                actionCaptor.capture(),
                eq(ActivityLogService.RESOURCE_STORAGE),
                isNull(),
                anyString(),
                statusCaptor.capture(),
                isNull(), isNull(),
                anyString()
        );
        assertEquals(ActivityLogService.ACTION_STORAGE_CONNECTION_TEST, actionCaptor.getValue());
        assertEquals(ActivityLogService.SUCCESS, statusCaptor.getValue());
    }

    @Test
    void testConnection_failure_logsConnectionTestWithFailureStatus() {
        when(registry.get(StorageProviderType.SFTP)).thenReturn(mockProvider);
        when(mockProvider.testConnection(any(StorageContext.class)))
                .thenReturn(ConnectionTestResult.fail("Authentication failed — check username / password."));
        when(encryption.decrypt(any())).thenReturn(null);

        UpdateStorageSettingsRequest r = new UpdateStorageSettingsRequest();
        r.setDefaultProvider("SFTP");
        r.setSftpHost("sftp.example.com");
        r.setSftpPort("22");
        r.setSftpUsername("user");
        r.setSftpPassword("wrongpass");
        r.setSftpRemoteDir("/uploads");

        StorageConnectionTestResponse response = service.testConnection(user, r);

        assertFalse(response.success());

        ArgumentCaptor<String> statusCaptor = ArgumentCaptor.forClass(String.class);
        verify(activityLogService, times(1)).log(
                eq(user),
                eq(ActivityLogService.ACTION_STORAGE_CONNECTION_TEST),
                eq(ActivityLogService.RESOURCE_STORAGE),
                isNull(),
                anyString(),
                statusCaptor.capture(),
                isNull(), isNull(),
                anyString()
        );
        assertEquals(ActivityLogService.FAILURE, statusCaptor.getValue());
    }

    // ------------------------------------------------------------------
    // 4. Only ONE log entry per operation
    // ------------------------------------------------------------------

    @Test
    void updateSettings_exactlyOneLogEntry() {
        when(repository.findByUserId(1L)).thenReturn(Optional.of(existingSettings("LOCAL")));
        service.updateSettings(user, req("SFTP"));
        verify(activityLogService, times(1)).log(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testConnection_exactlyOneLogEntry() {
        when(registry.get(StorageProviderType.S3)).thenReturn(mockProvider);
        when(mockProvider.testConnection(any())).thenReturn(ConnectionTestResult.ok("OK"));
        when(encryption.decrypt(any())).thenReturn(null);

        UpdateStorageSettingsRequest r = req("S3");
        r.setS3Bucket("b");
        r.setS3Region("us-east-1");
        service.testConnection(user, r);

        verify(activityLogService, times(1)).log(
                any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    // ------------------------------------------------------------------
    // 5. All provider label transitions
    // ------------------------------------------------------------------

    @Test
    void providerLabels_allTransitions_correctResourceName() {
        record Transition(String from, String to, String expectedLabel) {}
        var transitions = new Transition[] {
            new Transition("LOCAL",        "S3",           "Local Storage → Amazon S3"),
            new Transition("S3",           "GOOGLE_DRIVE", "Amazon S3 → Google Drive"),
            new Transition("GOOGLE_DRIVE", "ONEDRIVE",     "Google Drive → OneDrive"),
            new Transition("ONEDRIVE",     "LOCAL",        "OneDrive → Local Storage"),
            new Transition("LOCAL",        "SFTP",         "Local Storage → SFTP"),
            new Transition("SFTP",         "S3",           "SFTP → Amazon S3"),
        };

        for (var t : transitions) {
            clearInvocations(activityLogService);
            when(repository.findByUserId(1L)).thenReturn(Optional.of(existingSettings(t.from())));
            service.updateSettings(user, req(t.to()));

            ArgumentCaptor<String> resourceCaptor = ArgumentCaptor.forClass(String.class);
            verify(activityLogService).log(
                    eq(user), anyString(), anyString(), isNull(),
                    resourceCaptor.capture(),
                    anyString(), isNull(), isNull(), anyString()
            );
            assertEquals(t.expectedLabel(), resourceCaptor.getValue(),
                    "Transition " + t.from() + " → " + t.to());
        }
    }
}
