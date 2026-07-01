package com.project.filemanagement.dto;

import java.util.List;

/**
 * A user's storage configuration as exposed to the UI. SECRETS ARE NEVER
 * INCLUDED — only non-sensitive fields plus boolean "configured/connected"
 * flags so the UI can show state without ever receiving keys or tokens.
 */
public record StorageSettingsResponse(
        String defaultProvider,
        List<String> supportedProviders,

        String localDirectory,

        String s3Bucket,
        String s3Region,
        boolean s3Configured,

        String googleClientId,
        boolean googleConnected,

        String oneDriveClientId,
        boolean oneDriveConnected,

        String sftpHost,
        String sftpPort,
        String sftpUsername,
        String sftpRemoteDir,
        boolean sftpConfigured
) {
}
