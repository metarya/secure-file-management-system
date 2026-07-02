package com.project.filemanagement.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies profile-specific behavior of {@link CredentialEncryptionService}.
 *
 * <ul>
 *   <li>Dev profile: built-in key allows startup without env var.</li>
 *   <li>Production profile: blank/missing key fails fast with a descriptive error.</li>
 *   <li>Production profile: valid configured key encrypts and decrypts correctly.</li>
 * </ul>
 */
class CredentialEncryptionServiceTest {

    private static final String SALT = "5c0744940b5c369b";
    private static final String DEV_KEY = "dev-storage-encryption-key-change-me";

    // ------------------------------------------------------------------
    // 1. Dev profile — application-dev.properties supplies the built-in key
    //    so the bean constructs without APP_STORAGE_ENCRYPTION_KEY being set.
    // ------------------------------------------------------------------

    @Test
    void devProfileStartsSuccessfullyWithBuiltInKey() {
        // Mirrors what application-dev.properties provides when no env var is set
        CredentialEncryptionService service = new CredentialEncryptionService(DEV_KEY, SALT);
        assertThat(service).isNotNull();
    }

    // ------------------------------------------------------------------
    // 2. Production profile — blank or missing key must fail immediately
    // ------------------------------------------------------------------

    @Test
    void blankKeyThrowsDescriptiveIllegalStateException() {
        assertThatThrownBy(() -> new CredentialEncryptionService("", SALT))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_STORAGE_ENCRYPTION_KEY");
    }

    @Test
    void whitespaceKeyThrowsDescriptiveIllegalStateException() {
        assertThatThrownBy(() -> new CredentialEncryptionService("   ", SALT))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("APP_STORAGE_ENCRYPTION_KEY");
    }

    // ------------------------------------------------------------------
    // 3. Production profile — valid key: encrypt/decrypt round-trip
    // ------------------------------------------------------------------

    @Test
    void configuredKeyEncryptsAndDecryptsRoundTrip() {
        CredentialEncryptionService service =
                new CredentialEncryptionService("a-strong-production-key-32chars!", SALT);

        String plaintext = "super-secret-s3-access-key";
        String ciphertext = service.encrypt(plaintext);

        assertThat(ciphertext).isNotEqualTo(plaintext);
        assertThat(service.decrypt(ciphertext)).isEqualTo(plaintext);
    }

    @Test
    void encryptProducesDifferentCiphertextsForSamePlaintext() {
        // Encryptors.delux uses a random IV per call
        CredentialEncryptionService service =
                new CredentialEncryptionService("key-for-iv-uniqueness-test!!", SALT);

        String a = service.encrypt("value");
        String b = service.encrypt("value");
        assertThat(a).isNotEqualTo(b);
        assertThat(service.decrypt(a)).isEqualTo("value");
        assertThat(service.decrypt(b)).isEqualTo("value");
    }

    // ------------------------------------------------------------------
    // 4. Null / empty plaintext passes through unchanged (no NPE)
    // ------------------------------------------------------------------

    @Test
    void nullAndEmptyPlaintextPassThroughEncrypt() {
        CredentialEncryptionService service =
                new CredentialEncryptionService("any-key-for-passthrough-test!", SALT);
        assertThat(service.encrypt(null)).isNull();
        assertThat(service.encrypt("")).isEmpty();
    }

    @Test
    void nullAndEmptyCiphertextPassThroughDecrypt() {
        CredentialEncryptionService service =
                new CredentialEncryptionService("any-key-for-passthrough-test!", SALT);
        assertThat(service.decrypt(null)).isNull();
        assertThat(service.decrypt("")).isEmpty();
    }
}
