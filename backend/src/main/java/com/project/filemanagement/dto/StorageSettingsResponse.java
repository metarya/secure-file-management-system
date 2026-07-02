package com.project.filemanagement.dto;

import java.util.List;

/**
 * A user's storage configuration as exposed to the UI. SECRETS ARE NEVER
 * INCLUDED — only non-sensitive fields plus boolean "configured/connected"
 * flags so the UI can show state without ever receiving keys or tokens.
 *
 * <ul>
 *   <li>{@code supportedProviders} — only providers the user has saved credentials
 *       for; used to indicate which ones are ready to use.</li>
 *   <li>{@code allProviders} — every provider the system supports (always all 5);
 *       used by the settings page default-provider dropdown so a user can select
 *       any provider to configure its credentials, even before credentials exist.</li>
 * </ul>
 */
public record StorageSettingsResponse(
        String defaultProvider,
        List<String> supportedProviders,
        List<String> allProviders,

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
