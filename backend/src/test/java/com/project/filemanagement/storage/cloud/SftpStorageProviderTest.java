package com.project.filemanagement.storage.cloud;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

import org.apache.sshd.common.file.virtualfs.VirtualFileSystemFactory;
import org.apache.sshd.server.SshServer;
import org.apache.sshd.server.keyprovider.SimpleGeneratorHostKeyProvider;
import org.apache.sshd.sftp.server.SftpSubsystemFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.io.TempDir;

import com.jcraft.jsch.HostKey;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.Session;
import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageModels.ConnectionTestResult;
import com.project.filemanagement.storage.StorageModels.ObjectMetadata;
import com.project.filemanagement.storage.StorageModels.StorageException;
import com.project.filemanagement.storage.StorageModels.StoredContent;
import com.project.filemanagement.storage.StorageProviderType;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for {@link SftpStorageProvider} using an embedded Apache
 * MINA SSHD server running on localhost. Every test exercises the real SFTP
 * protocol — no mocks of JSch internals.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class SftpStorageProviderTest {

    private static final String USER = "testuser";
    private static final String PASS = "testpass";

    private SshServer sshServer;
    private int port;
    private Path rootDir;
    private Path knownHostsFile;
    private Path bogusKnownHostsFile;

    private final SftpStorageProvider provider = new SftpStorageProvider();

    @BeforeAll
    void startServer(@TempDir Path tempDir) throws IOException {
        rootDir = tempDir;

        sshServer = SshServer.setUpDefaultServer();
        sshServer.setPort(0); // OS assigns a free port
        sshServer.setKeyPairProvider(new SimpleGeneratorHostKeyProvider(tempDir.resolve("host.ser")));
        sshServer.setPasswordAuthenticator((username, password, session) ->
                USER.equals(username) && PASS.equals(password));
        sshServer.setSubsystemFactories(java.util.List.of(new SftpSubsystemFactory()));
        sshServer.setFileSystemFactory(new VirtualFileSystemFactory(rootDir));
        sshServer.start();
        port = sshServer.getPort();

        // Bootstrap: connect once with trust-on-first-use to capture the server's
        // actual host key, then write it to a temp known_hosts file used by all tests.
        knownHostsFile = tempDir.resolve("known_hosts");
        captureServerHostKey(knownHostsFile);

        // A bogus known_hosts file with a fake key — used to verify rejection.
        bogusKnownHostsFile = tempDir.resolve("known_hosts_bogus");
        Files.writeString(bogusKnownHostsFile,
            // Minimal but syntactically valid RSA entry for a key that will never match.
            "[localhost]:" + port + " ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAAQQDfake" +
            "KeyThatWillNeverMatchTheServerAAAAAAAAAAAAAAAAAAAAAAAA\n",
            StandardCharsets.UTF_8);
    }

    /**
     * Makes a single TOFU connection (StrictHostKeyChecking=no) to capture the
     * server's real host key, then writes it in known_hosts format so subsequent
     * connections can verify it with StrictHostKeyChecking=yes.
     */
    private void captureServerHostKey(Path target) throws IOException {
        try {
            JSch jsch = new JSch();
            Session bootstrap = jsch.getSession(USER, "localhost", port);
            bootstrap.setPassword(PASS);
            bootstrap.setConfig("StrictHostKeyChecking", "no");
            bootstrap.connect(5_000);
            HostKey hk = bootstrap.getHostKey();
            // known_hosts format: [host]:port key-type base64-key
            String entry = "[localhost]:" + port + " " + hk.getType() + " " + hk.getKey() + "\n";
            Files.writeString(target, entry, StandardCharsets.UTF_8);
            bootstrap.disconnect();
        } catch (Exception e) {
            throw new IOException("Failed to capture server host key for test setup", e);
        }
    }

    @AfterAll
    void stopServer() throws IOException {
        if (sshServer != null) {
            sshServer.stop();
        }
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private StorageContext ctx(String remoteDir) {
        return new StorageContext("test@example.com", StorageProviderType.SFTP, Map.of(
                "host", "localhost",
                "port", String.valueOf(port),
                "username", USER,
                "password", PASS,
                "remoteDir", remoteDir,
                "knownHostsPath", knownHostsFile.toString()
        ));
    }

    private StorageContext ctxBadPass() {
        return new StorageContext("test@example.com", StorageProviderType.SFTP, Map.of(
                "host", "localhost",
                "port", String.valueOf(port),
                "username", USER,
                "password", "wrongpassword",
                "remoteDir", "/uploads",
                "knownHostsPath", knownHostsFile.toString()
        ));
    }

    // ------------------------------------------------------------------
    // 1. Provider identity
    // ------------------------------------------------------------------

    @Test
    void getType_returnsStfp() {
        assertEquals(StorageProviderType.SFTP, provider.getType());
    }

    // ------------------------------------------------------------------
    // 2. Upload + Download
    // ------------------------------------------------------------------

    @Test
    void upload_thenDownload_returnsCorrectBytes() throws IOException {
        Files.createDirectories(rootDir.resolve("uploads"));
        StorageContext ctx = ctx("/uploads");
        byte[] content = "Hello, SFTP!".getBytes();

        String key = provider.upload(ctx, "hello.txt", content, "text/plain");
        assertNotNull(key, "upload must return a non-null storage key");

        StoredContent downloaded = provider.download(ctx, key);
        assertArrayEquals(content, downloaded.data(), "downloaded bytes must match uploaded bytes");
    }

    @Test
    void upload_createsRemoteDirIfMissing() {
        StorageContext ctx = ctx("/auto-created-dir");
        byte[] content = "auto dir content".getBytes();

        // Should not throw even though the directory doesn't exist yet.
        String key = provider.upload(ctx, "file.txt", content, "text/plain");
        assertNotNull(key);

        StoredContent downloaded = provider.download(ctx, key);
        assertArrayEquals(content, downloaded.data());
    }

    @Test
    void upload_nullBytes_treatedAsEmpty() throws IOException {
        Files.createDirectories(rootDir.resolve("null-test"));
        StorageContext ctx = ctx("/null-test");

        String key = provider.upload(ctx, "empty.bin", null, "application/octet-stream");
        StoredContent result = provider.download(ctx, key);
        assertEquals(0, result.data().length);
    }

    // ------------------------------------------------------------------
    // 3. Delete
    // ------------------------------------------------------------------

    @Test
    void delete_removesFile() throws IOException {
        Files.createDirectories(rootDir.resolve("del"));
        StorageContext ctx = ctx("/del");
        String key = provider.upload(ctx, "todelete.txt", "bye".getBytes(), "text/plain");

        assertTrue(provider.exists(ctx, key), "file should exist before delete");
        provider.delete(ctx, key);
        assertFalse(provider.exists(ctx, key), "file should not exist after delete");
    }

    @Test
    void delete_nonExistentFile_doesNotThrow() throws IOException {
        Files.createDirectories(rootDir.resolve("del2"));
        StorageContext ctx = ctx("/del2");
        // Must not throw (mirrors S3/Local behavior).
        assertDoesNotThrow(() -> provider.delete(ctx, "/del2/ghost-file-xyz.txt"));
    }

    // ------------------------------------------------------------------
    // 4. Exists
    // ------------------------------------------------------------------

    @Test
    void exists_returnsTrueForPresentFile() throws IOException {
        Files.createDirectories(rootDir.resolve("exist-test"));
        StorageContext ctx = ctx("/exist-test");
        String key = provider.upload(ctx, "present.txt", "data".getBytes(), "text/plain");
        assertTrue(provider.exists(ctx, key));
    }

    @Test
    void exists_returnsFalseForMissingFile() throws IOException {
        Files.createDirectories(rootDir.resolve("exist-test2"));
        StorageContext ctx = ctx("/exist-test2");
        assertFalse(provider.exists(ctx, "/exist-test2/no-such-file-999.txt"));
    }

    // ------------------------------------------------------------------
    // 5. Metadata
    // ------------------------------------------------------------------

    @Test
    void getMetadata_returnsCorrectSize() throws IOException {
        Files.createDirectories(rootDir.resolve("meta-test"));
        StorageContext ctx = ctx("/meta-test");
        byte[] data = "metadata content".getBytes();
        String key = provider.upload(ctx, "meta.txt", data, "text/plain");

        ObjectMetadata meta = provider.getMetadata(ctx, key);
        assertEquals(key, meta.storageKey());
        assertEquals(data.length, meta.size());
    }

    // ------------------------------------------------------------------
    // 6. Test Connection — success
    // ------------------------------------------------------------------

    @Test
    void testConnection_validCredentials_succeeds() throws IOException {
        Files.createDirectories(rootDir.resolve("conn-test"));
        StorageContext ctx = ctx("/conn-test");

        ConnectionTestResult result = provider.testConnection(ctx);
        assertTrue(result.success(), "testConnection should succeed: " + result.message());
        assertTrue(result.message().contains("localhost"), "message should mention host");
    }

    // ------------------------------------------------------------------
    // 7. Test Connection — invalid credentials
    // ------------------------------------------------------------------

    @Test
    void testConnection_badPassword_returnsAuthError() {
        ConnectionTestResult result = provider.testConnection(ctxBadPass());
        assertFalse(result.success());
        String msg = result.message().toLowerCase();
        assertTrue(msg.contains("auth") || msg.contains("password") || msg.contains("failed"),
                "error message should indicate auth failure, got: " + result.message());
    }

    // ------------------------------------------------------------------
    // 8. Invalid host
    // ------------------------------------------------------------------

    @Test
    void testConnection_unknownHost_returnsMeaningfulError() {
        StorageContext ctx = new StorageContext("u@x.com", StorageProviderType.SFTP, Map.of(
                "host", "this-host-does-not-exist-xyz.invalid",
                "port", "22",
                "username", USER,
                "password", PASS,
                "remoteDir", "/uploads",
                "knownHostsPath", knownHostsFile.toString()
        ));
        ConnectionTestResult result = provider.testConnection(ctx);
        assertFalse(result.success());
        // Should mention host or timeout — not a generic NPE.
        assertNotNull(result.message());
        assertFalse(result.message().isBlank());
    }

    // ------------------------------------------------------------------
    // 9. Invalid remote directory
    // ------------------------------------------------------------------

    @Test
    void testConnection_nonExistentDirectory_returnsDirectoryError() {
        // Use a directory that the VFS root can't list (does not exist and we won't create it).
        StorageContext ctx = ctx("/this/path/does/not/exist/ever");
        ConnectionTestResult result = provider.testConnection(ctx);
        assertFalse(result.success());
        String msg = result.message().toLowerCase();
        assertTrue(msg.contains("directory") || msg.contains("no such") || msg.contains("permission") || msg.contains("exist"),
                "error should describe directory problem, got: " + result.message());
    }

    // ------------------------------------------------------------------
    // 10. Provider type integrity
    // ------------------------------------------------------------------

    @Test
    void upload_storageKeyContainsSuggestedFilename() throws IOException {
        Files.createDirectories(rootDir.resolve("key-test"));
        StorageContext ctx = ctx("/key-test");
        String key = provider.upload(ctx, "myfile.pdf", "pdf-bytes".getBytes(), "application/pdf");
        // Key must reference the remote directory and contain a sanitized filename.
        assertTrue(key.startsWith("/key-test/"), "key should be under remoteDir, got: " + key);
        assertTrue(key.contains("myfile"), "key should contain sanitized filename, got: " + key);
    }

    @Test
    void upload_specialCharactersInFilename_sanitized() throws IOException {
        Files.createDirectories(rootDir.resolve("sanitize-test"));
        StorageContext ctx = ctx("/sanitize-test");
        // Filename with special chars — must not throw and key must be valid.
        String key = provider.upload(ctx, "my file (1) & more!.txt", "bytes".getBytes(), "text/plain");
        assertNotNull(key);
        assertDoesNotThrow(() -> provider.download(ctx, key));
    }

    // ------------------------------------------------------------------
    // 11. Config validation
    // ------------------------------------------------------------------

    @Test
    void upload_missingHost_throwsStorageException() {
        StorageContext ctx = new StorageContext("u@x.com", StorageProviderType.SFTP, Map.of(
                "port", "22", "username", USER, "password", PASS, "remoteDir", "/up",
                "knownHostsPath", knownHostsFile.toString()
        ));
        assertThrows(StorageException.class, () -> provider.upload(ctx, "f.txt", new byte[0], null));
    }

    @Test
    void upload_invalidPort_throwsStorageException() {
        StorageContext ctx = new StorageContext("u@x.com", StorageProviderType.SFTP, Map.of(
                "host", "localhost", "port", "notaport",
                "username", USER, "password", PASS, "remoteDir", "/up",
                "knownHostsPath", knownHostsFile.toString()
        ));
        assertThrows(StorageException.class, () -> provider.upload(ctx, "f.txt", new byte[0], null));
    }

    @Test
    void upload_missingUsername_throwsStorageException() {
        StorageContext ctx = new StorageContext("u@x.com", StorageProviderType.SFTP, Map.of(
                "host", "localhost", "port", "22", "password", PASS, "remoteDir", "/up",
                "knownHostsPath", knownHostsFile.toString()
        ));
        assertThrows(StorageException.class, () -> provider.upload(ctx, "f.txt", new byte[0], null));
    }

    // ------------------------------------------------------------------
    // 12. Host key verification
    // ------------------------------------------------------------------

    @Test
    void testConnection_missingKnownHostsPath_failsWithDescriptiveMessage() {
        StorageContext ctx = new StorageContext("u@x.com", StorageProviderType.SFTP, Map.of(
                "host", "localhost",
                "port", String.valueOf(port),
                "username", USER,
                "password", PASS,
                "remoteDir", "/uploads"
                // no knownHostsPath
        ));
        // Provider must refuse the connection and return a clear error.
        ConnectionTestResult result = provider.testConnection(ctx);
        assertFalse(result.success(), "connection without known_hosts must not succeed");
        assertTrue(result.message().contains("known_hosts"),
                "error should mention known_hosts, got: " + result.message());
    }

    @Test
    void testConnection_unknownHostKey_returnsHostKeyError() {
        // Use the bogus known_hosts file — server key will not match.
        StorageContext ctx = new StorageContext("u@x.com", StorageProviderType.SFTP, Map.of(
                "host", "localhost",
                "port", String.valueOf(port),
                "username", USER,
                "password", PASS,
                "remoteDir", "/uploads",
                "knownHostsPath", bogusKnownHostsFile.toString()
        ));
        ConnectionTestResult result = provider.testConnection(ctx);
        assertFalse(result.success(), "connection should fail when host key is not trusted");
        // Error should be descriptive (not a generic NPE).
        assertNotNull(result.message());
        assertFalse(result.message().isBlank());
    }
}
