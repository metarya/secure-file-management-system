package com.project.filemanagement.storage;

import java.util.Map;

/**
 * The DECRYPTED, ready-to-use configuration a {@link StorageProvider} needs to
 * talk to a specific user's backend. Built per-request from the user's stored
 * (encrypted) settings — secrets live here only transiently, never in logs or
 * API responses.
 */
public record StorageContext(
        String userEmail,
        StorageProviderType type,
        Map<String, String> settings
) {
    public String get(String key) {
        return settings == null ? null : settings.get(key);
    }

    public String getOrDefault(String key, String fallback) {
        String v = get(key);
        return (v == null || v.isBlank()) ? fallback : v;
    }
}
