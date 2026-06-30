package com.project.filemanagement.storage;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import com.project.filemanagement.storage.StorageModels.ConnectionTestResult;
import com.project.filemanagement.storage.StorageModels.ObjectMetadata;
import com.project.filemanagement.storage.StorageModels.StorageException;
import com.project.filemanagement.storage.StorageModels.StoredContent;

/**
 * Filesystem-backed provider. Objects are written under a configurable upload
 * directory (per-user subfolder), and the returned storage key is the path
 * relative to that root. Fully functional with no external dependencies.
 */
@Component
public class LocalStorageProvider implements StorageProvider {

    /** Default root when the user hasn't set a directory; mirrors the existing uploads/ usage. */
    @Value("${storage.local.base-dir:uploads/user-storage}")
    private String defaultBaseDir;

    @Override
    public StorageProviderType getType() {
        return StorageProviderType.LOCAL;
    }

    private Path rootFor(StorageContext ctx) {
        String dir = ctx == null ? null : ctx.get("directory");
        return Paths.get(dir == null || dir.isBlank() ? defaultBaseDir : dir);
    }

    private static String safeUserSegment(StorageContext ctx) {
        String email = ctx == null ? "anonymous" : ctx.userEmail();
        return (email == null ? "anonymous" : email).replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    @Override
    public String upload(StorageContext ctx, String suggestedKey, byte[] data, String contentType) {
        try {
            String userSegment = safeUserSegment(ctx);
            String objectName = UUID.randomUUID() + "_" + sanitize(suggestedKey);
            Path dir = rootFor(ctx).resolve(userSegment);
            Files.createDirectories(dir);
            Path target = dir.resolve(objectName);
            Files.write(target, data == null ? new byte[0] : data);
            // Storage key is provider-relative so it is portable across roots.
            return userSegment + "/" + objectName;
        } catch (IOException e) {
            throw new StorageException("Local upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public StoredContent download(StorageContext ctx, String storageKey) {
        try {
            Path target = rootFor(ctx).resolve(storageKey);
            if (!Files.exists(target)) {
                throw new StorageException("Local object not found: " + storageKey);
            }
            return new StoredContent(Files.readAllBytes(target), null);
        } catch (IOException e) {
            throw new StorageException("Local download failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void delete(StorageContext ctx, String storageKey) {
        try {
            Files.deleteIfExists(rootFor(ctx).resolve(storageKey));
        } catch (IOException e) {
            throw new StorageException("Local delete failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean exists(StorageContext ctx, String storageKey) {
        return storageKey != null && Files.exists(rootFor(ctx).resolve(storageKey));
    }

    @Override
    public ObjectMetadata getMetadata(StorageContext ctx, String storageKey) {
        try {
            Path target = rootFor(ctx).resolve(storageKey);
            long size = Files.exists(target) ? Files.size(target) : 0L;
            return new ObjectMetadata(storageKey, size, null, null);
        } catch (IOException e) {
            throw new StorageException("Local metadata failed: " + e.getMessage(), e);
        }
    }

    @Override
    public ConnectionTestResult testConnection(StorageContext ctx) {
        try {
            Path root = rootFor(ctx);
            Files.createDirectories(root);
            // Probe write access with a temp marker.
            Path probe = root.resolve(".write-test-" + UUID.randomUUID());
            Files.write(probe, new byte[] {1});
            Files.deleteIfExists(probe);
            return ConnectionTestResult.ok("Directory is writable: " + root.toAbsolutePath());
        } catch (Exception e) {
            return ConnectionTestResult.fail("Directory not writable: " + e.getMessage());
        }
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) {
            return "object";
        }
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
