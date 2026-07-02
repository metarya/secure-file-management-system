package com.project.filemanagement.service;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.project.filemanagement.entity.UserStorageSettings;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for connectedProviders() — verifies that only providers whose
 * credentials are actually saved are returned, so the UI never shows a
 * provider the user cannot use.
 */
class ConnectedProvidersTest {

    // ------------------------------------------------------------------
    // null / empty settings
    // ------------------------------------------------------------------

    @Test
    void nullSettings_returnsOnlyLocal() {
        List<String> result = UserStorageSettingsService.connectedProviders(null);
        assertEquals(List.of("LOCAL"), result);
    }

    @Test
    void emptySettings_returnsOnlyLocal() {
        List<String> result = UserStorageSettingsService.connectedProviders(new UserStorageSettings());
        assertEquals(List.of("LOCAL"), result);
    }

    // ------------------------------------------------------------------
    // S3
    // ------------------------------------------------------------------

    @Test
    void s3Connected_whenAllFourFieldsPresent() {
        UserStorageSettings s = new UserStorageSettings();
        s.setS3Bucket("my-bucket");
        s.setS3Region("us-east-1");
        s.setS3AccessKeyEnc("enc-access");
        s.setS3SecretKeyEnc("enc-secret");

        assertTrue(UserStorageSettingsService.connectedProviders(s).contains("S3"));
    }

    @Test
    void s3NotConnected_whenSecretKeyMissing() {
        UserStorageSettings s = new UserStorageSettings();
        s.setS3Bucket("my-bucket");
        s.setS3Region("us-east-1");
        s.setS3AccessKeyEnc("enc-access");
        // no secret key

        assertFalse(UserStorageSettingsService.connectedProviders(s).contains("S3"));
    }

    @Test
    void s3NotConnected_whenBucketMissing() {
        UserStorageSettings s = new UserStorageSettings();
        s.setS3Region("us-east-1");
        s.setS3AccessKeyEnc("enc-access");
        s.setS3SecretKeyEnc("enc-secret");

        assertFalse(UserStorageSettingsService.connectedProviders(s).contains("S3"));
    }

    // ------------------------------------------------------------------
    // Google Drive
    // ------------------------------------------------------------------

    @Test
    void googleDriveConnected_whenClientIdAndRefreshTokenPresent() {
        UserStorageSettings s = new UserStorageSettings();
        s.setGdriveClientId("client-id");
        s.setGdriveRefreshTokenEnc("enc-refresh");

        assertTrue(UserStorageSettingsService.connectedProviders(s).contains("GOOGLE_DRIVE"));
    }

    @Test
    void googleDriveNotConnected_whenRefreshTokenMissing() {
        UserStorageSettings s = new UserStorageSettings();
        s.setGdriveClientId("client-id");

        assertFalse(UserStorageSettingsService.connectedProviders(s).contains("GOOGLE_DRIVE"));
    }

    // ------------------------------------------------------------------
    // OneDrive
    // ------------------------------------------------------------------

    @Test
    void oneDriveConnected_whenClientIdAndRefreshTokenPresent() {
        UserStorageSettings s = new UserStorageSettings();
        s.setOnedriveClientId("od-client");
        s.setOnedriveRefreshTokenEnc("enc-refresh");

        assertTrue(UserStorageSettingsService.connectedProviders(s).contains("ONEDRIVE"));
    }

    @Test
    void oneDriveNotConnected_whenClientIdMissing() {
        UserStorageSettings s = new UserStorageSettings();
        s.setOnedriveRefreshTokenEnc("enc-refresh");

        assertFalse(UserStorageSettingsService.connectedProviders(s).contains("ONEDRIVE"));
    }

    // ------------------------------------------------------------------
    // SFTP
    // ------------------------------------------------------------------

    @Test
    void sftpConnected_whenHostAndPasswordPresent() {
        UserStorageSettings s = new UserStorageSettings();
        s.setSftpHost("sftp.example.com");
        s.setSftpPasswordEnc("enc-pw");

        assertTrue(UserStorageSettingsService.connectedProviders(s).contains("SFTP"));
    }

    @Test
    void sftpNotConnected_whenPasswordMissing() {
        UserStorageSettings s = new UserStorageSettings();
        s.setSftpHost("sftp.example.com");

        assertFalse(UserStorageSettingsService.connectedProviders(s).contains("SFTP"));
    }

    // ------------------------------------------------------------------
    // Multi-provider combinations
    // ------------------------------------------------------------------

    @Test
    void onlyConfiguredProvidersReturned_localAndSftp() {
        UserStorageSettings s = new UserStorageSettings();
        s.setSftpHost("sftp.example.com");
        s.setSftpPasswordEnc("enc-pw");

        List<String> result = UserStorageSettingsService.connectedProviders(s);
        assertEquals(List.of("LOCAL", "SFTP"), result);
        assertFalse(result.contains("S3"));
        assertFalse(result.contains("GOOGLE_DRIVE"));
        assertFalse(result.contains("ONEDRIVE"));
    }

    @Test
    void allFiveProviders_whenAllConfigured() {
        UserStorageSettings s = new UserStorageSettings();
        s.setS3Bucket("b"); s.setS3Region("r"); s.setS3AccessKeyEnc("a"); s.setS3SecretKeyEnc("k");
        s.setGdriveClientId("gc"); s.setGdriveRefreshTokenEnc("gr");
        s.setOnedriveClientId("oc"); s.setOnedriveRefreshTokenEnc("or");
        s.setSftpHost("h"); s.setSftpPasswordEnc("p");

        List<String> result = UserStorageSettingsService.connectedProviders(s);
        assertEquals(5, result.size());
        assertTrue(result.containsAll(List.of("LOCAL", "S3", "GOOGLE_DRIVE", "ONEDRIVE", "SFTP")));
    }

    @Test
    void localAlwaysFirst() {
        UserStorageSettings s = new UserStorageSettings();
        s.setSftpHost("h"); s.setSftpPasswordEnc("p");

        List<String> result = UserStorageSettingsService.connectedProviders(s);
        assertEquals("LOCAL", result.get(0));
    }
}
