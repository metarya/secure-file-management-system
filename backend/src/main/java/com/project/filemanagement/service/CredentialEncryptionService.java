package com.project.filemanagement.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

/**
 * Symmetric encryption for storage-provider secrets at rest (access/secret keys,
 * OAuth client secrets & refresh tokens).
 *
 * <p>Backed by Spring Security's {@link Encryptors#delux} (AES with a random IV
 * per value), so two encryptions of the same plaintext differ. The key and salt
 * come from configuration / environment; a build-time default is provided only
 * so the app starts in development — production must override
 * {@code app.storage.encryption-key} and {@code app.storage.encryption-salt}.
 */
@Service
public class CredentialEncryptionService {

    private final TextEncryptor encryptor;

    public CredentialEncryptionService(
            @Value("${app.storage.encryption-key:dev-storage-encryption-key-change-me}") String key,
            // Salt must be a hex-encoded string.
            @Value("${app.storage.encryption-salt:5c0744940b5c369b}") String salt
    ) {
        this.encryptor = Encryptors.delux(key, salt);
    }

    /** Encrypts a plaintext secret; null/blank passes through unchanged. */
    public String encrypt(String plaintext) {
        if (plaintext == null || plaintext.isEmpty()) {
            return plaintext;
        }
        return encryptor.encrypt(plaintext);
    }

    /** Decrypts a previously-encrypted value; null/blank passes through unchanged. */
    public String decrypt(String ciphertext) {
        if (ciphertext == null || ciphertext.isEmpty()) {
            return ciphertext;
        }
        return encryptor.decrypt(ciphertext);
    }
}
