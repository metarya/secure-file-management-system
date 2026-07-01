package com.project.filemanagement.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A single user's storage configuration. Each user independently chooses a
 * default provider for THEIR OWN uploads; administrators can view but never
 * modify another user's settings.
 *
 * <p>Sensitive credentials (access/secret keys, OAuth client secret & refresh
 * tokens) are stored ENCRYPTED here and are never returned in API responses.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "user_storage_settings")
public class UserStorageSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private Long userId;

    /** LOCAL | S3 | GOOGLE_DRIVE | ONEDRIVE. */
    @Column(name = "default_provider", nullable = false, length = 32)
    private String defaultProvider = "LOCAL";

    // --- Local (non-secret) ---
    @Column(name = "local_directory", length = 500)
    private String localDirectory;

    // --- S3 ---
    @Column(name = "s3_bucket", length = 255)
    private String s3Bucket;

    @Column(name = "s3_region", length = 64)
    private String s3Region;

    @Column(name = "s3_access_key_enc", length = 1024)
    private String s3AccessKeyEnc;

    @Column(name = "s3_secret_key_enc", length = 1024)
    private String s3SecretKeyEnc;

    // --- Google Drive ---
    @Column(name = "gdrive_client_id", length = 512)
    private String gdriveClientId;

    @Column(name = "gdrive_client_secret_enc", length = 1024)
    private String gdriveClientSecretEnc;

    @Column(name = "gdrive_refresh_token_enc", length = 2048)
    private String gdriveRefreshTokenEnc;

    // --- OneDrive ---
    @Column(name = "onedrive_client_id", length = 512)
    private String onedriveClientId;

    @Column(name = "onedrive_client_secret_enc", length = 1024)
    private String onedriveClientSecretEnc;

    @Column(name = "onedrive_refresh_token_enc", length = 2048)
    private String onedriveRefreshTokenEnc;

    // --- SFTP ---
    @Column(name = "sftp_host", length = 255)
    private String sftpHost;

    @Column(name = "sftp_port", length = 10)
    private String sftpPort;

    @Column(name = "sftp_username", length = 255)
    private String sftpUsername;

    @Column(name = "sftp_password_enc", length = 1024)
    private String sftpPasswordEnc;

    @Column(name = "sftp_remote_dir", length = 500)
    private String sftpRemoteDir;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
}
