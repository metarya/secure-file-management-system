package com.project.filemanagement.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.encrypt.Encryptors;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;

/**
 * Symmetric encryption for storage-provider secrets at rest (access/secret keys,
 * OAuth client secrets &amp; refresh tokens).
 *
 * <p>Backed by Spring Security's {@link Encryptors#delux} (AES-256 with a random IV
 * per value), so two encryptions of the same plaintext produce different ciphertexts.
 *
 * <p><b>Key</b>: supplied via {@code app.storage.encryption-key}. In the {@code dev}
 * profile a built-in default is used automatically (see {@code application-dev.properties}).
 * In the {@code prod} profile the {@code APP_STORAGE_ENCRYPTION_KEY} environment variable
 * is required; startup fails immediately if it is absent or blank.
 *
 * <p><b>Salt</b>: a fixed hex string ({@code app.storage.encryption-salt}) used as a
 * PBKDF2 KDF parameter. It is not secret, but changing it invalidates all existing
 * encrypted credentials. Override via {@code APP_STORAGE_ENCRYPTION_SALT} only when
 * intentionally rotating and re-encrypting all stored secrets.
 */
@Service
public class CredentialEncryptionService {

    private static final Logger log = LoggerFactory.getLogger(CredentialEncryptionService.class);

    private final TextEncryptor encryptor;

    public CredentialEncryptionService(
            @Value("${app.storage.encryption-key}") String key,
            @Value("${app.storage.encryption-salt:5c0744940b5c369b}") String salt
    ) {
        if (key == null || key.isBlank()) {
            throw new IllegalStateException(
                    "app.storage.encryption-key must not be blank. " +
                    "Set the APP_STORAGE_ENCRYPTION_KEY environment variable. " +
                    "In the dev profile a built-in development key is used automatically.");
        }
        if ("dev-storage-encryption-key-change-me".equals(key)) {
            log.warn("***************************************************************");
            log.warn("* SECURITY WARNING: using the built-in development encryption *");
            log.warn("* key. This key is public and MUST NOT be used in production. *");
            log.warn("* Set APP_STORAGE_ENCRYPTION_KEY before deploying.            *");
            log.warn("***************************************************************");
        }
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
