package com.project.filemanagement.storage;

import com.project.filemanagement.storage.StorageModels.ConnectionTestResult;
import com.project.filemanagement.storage.StorageModels.ObjectMetadata;
import com.project.filemanagement.storage.StorageModels.StoredContent;

/**
 * Common contract every storage backend implements. Business services depend on
 * THIS interface only and resolve a concrete provider through
 * {@link StorageProviderRegistry} — there is no provider-specific {@code if/else}
 * anywhere in the application.
 *
 * <p>All operations are scoped to a single user's {@link StorageContext} (their
 * decrypted credentials / configuration), so one user's storage is fully
 * independent of another's.
 */
public interface StorageProvider {

    /** Which provider this implementation is. */
    StorageProviderType getType();

    /**
     * Stores {@code data} and returns an opaque storage key that uniquely
     * locates the object within this provider (persisted on the file row).
     */
    String upload(StorageContext ctx, String suggestedKey, byte[] data, String contentType);

    /** Returns the stored bytes for {@code storageKey}. */
    StoredContent download(StorageContext ctx, String storageKey);

    /**
     * Returns bytes for inline preview. Defaults to {@link #download}; providers
     * may override to serve a preview-optimized representation.
     */
    default StoredContent preview(StorageContext ctx, String storageKey) {
        return download(ctx, storageKey);
    }

    /** Deletes the object. No-op if it does not exist. */
    void delete(StorageContext ctx, String storageKey);

    /** Whether the object currently exists. */
    boolean exists(StorageContext ctx, String storageKey);

    /** Object metadata (size / content type / checksum) without fetching bytes. */
    ObjectMetadata getMetadata(StorageContext ctx, String storageKey);

    /** Verifies the configuration/credentials are usable (for the "Test connection" button). */
    ConnectionTestResult testConnection(StorageContext ctx);
}
