package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Payload to update a user's own storage settings. Secret fields (keys, client
 * secrets, refresh tokens) are write-only: when left blank the existing stored
 * value is preserved, so the UI never has to round-trip secrets.
 */
@Getter
@Setter
@NoArgsConstructor
public class UpdateStorageSettingsRequest {

    private String defaultProvider;

    private String localDirectory;

    private String s3Bucket;
    private String s3Region;
    private String s3AccessKey;
    private String s3SecretKey;

    private String googleClientId;
    private String googleClientSecret;
    private String googleRefreshToken;

    private String oneDriveClientId;
    private String oneDriveClientSecret;
    private String oneDriveRefreshToken;
}
