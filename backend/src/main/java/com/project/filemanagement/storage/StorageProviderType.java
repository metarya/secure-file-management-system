package com.project.filemanagement.storage;

/**
 * The storage backends a user can choose for THEIR OWN uploads. The architecture
 * is pluggable — adding a provider means adding an enum constant and a
 * {@link StorageProvider} bean; no business code changes.
 */
public enum StorageProviderType {
    LOCAL,
    S3,
    GOOGLE_DRIVE,
    ONEDRIVE;

    public static StorageProviderType fromString(String value) {
        if (value == null || value.isBlank()) {
            return LOCAL;
        }
        try {
            return StorageProviderType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return LOCAL;
        }
    }
}
