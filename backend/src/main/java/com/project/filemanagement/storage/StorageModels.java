package com.project.filemanagement.storage;

/**
 * Small value types shared across the storage abstraction, grouped here to keep
 * the package tidy.
 */
public final class StorageModels {

    private StorageModels() {
    }

    /** Bytes plus the content type to serve them with. */
    public record StoredContent(byte[] data, String contentType) {
    }

    /** Lightweight object metadata (no bytes). */
    public record ObjectMetadata(String storageKey, long size, String contentType, String checksum) {
    }

    /** Result of a connection test shown to the user before they save settings. */
    public record ConnectionTestResult(boolean success, String message) {
        public static ConnectionTestResult ok() {
            return new ConnectionTestResult(true, "Connected");
        }
        public static ConnectionTestResult ok(String message) {
            return new ConnectionTestResult(true, message);
        }
        public static ConnectionTestResult fail(String message) {
            return new ConnectionTestResult(false, message);
        }
    }

    /** Raised by providers for any storage-layer failure. */
    public static class StorageException extends RuntimeException {
        public StorageException(String message) {
            super(message);
        }
        public StorageException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
