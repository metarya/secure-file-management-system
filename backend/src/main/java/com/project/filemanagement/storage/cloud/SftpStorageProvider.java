package com.project.filemanagement.storage.cloud;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.jcraft.jsch.ChannelSftp;
import com.jcraft.jsch.JSch;
import com.jcraft.jsch.JSchException;
import com.jcraft.jsch.Session;
import com.jcraft.jsch.SftpException;
import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageProvider;
import com.project.filemanagement.storage.StorageProviderType;
import com.project.filemanagement.storage.StorageModels.ConnectionTestResult;
import com.project.filemanagement.storage.StorageModels.ObjectMetadata;
import com.project.filemanagement.storage.StorageModels.StorageException;
import com.project.filemanagement.storage.StorageModels.StoredContent;

/**
 * SFTP storage provider using the maintained com.github.mwiede:jsch fork.
 *
 * <p>Settings (all from {@link StorageContext}):
 * <ul>
 *   <li>{@code host} — SFTP server hostname or IP</li>
 *   <li>{@code port} — port number (default 22)</li>
 *   <li>{@code username}</li>
 *   <li>{@code password} — decrypted by the service layer before reaching here</li>
 *   <li>{@code remoteDir} — base directory on the server (default ".")</li>
 * </ul>
 */
@Component
public class SftpStorageProvider implements StorageProvider {

    @Override
    public StorageProviderType getType() {
        return StorageProviderType.SFTP;
    }

    // ------------------------------------------------------------------
    // StorageProvider operations
    // ------------------------------------------------------------------

    @Override
    public String upload(StorageContext ctx, String suggestedKey, byte[] data, String contentType) {
        SftpConfig cfg = config(ctx);
        String filename = sanitize(suggestedKey) + "_" + UUID.randomUUID();
        String remotePath = cfg.remoteDir() + "/" + filename;

        withChannel(cfg, ch -> {
            ensureDir(ch, cfg.remoteDir());
            ch.put(new ByteArrayInputStream(data == null ? new byte[0] : data), remotePath);
        });
        return remotePath;
    }

    @Override
    public StoredContent download(StorageContext ctx, String storageKey) {
        SftpConfig cfg = config(ctx);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        withChannel(cfg, ch -> ch.get(storageKey, out));
        return new StoredContent(out.toByteArray(), null);
    }

    @Override
    public void delete(StorageContext ctx, String storageKey) {
        SftpConfig cfg = config(ctx);
        withChannel(cfg, ch -> {
            try {
                ch.rm(storageKey);
            } catch (SftpException e) {
                // No-op if not found (mirrors S3/Local behaviour).
                if (e.id != ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                    throw e;
                }
            }
        });
    }

    @Override
    public boolean exists(StorageContext ctx, String storageKey) {
        SftpConfig cfg = config(ctx);
        boolean[] found = {false};
        withChannel(cfg, ch -> {
            try {
                ch.lstat(storageKey);
                found[0] = true;
            } catch (SftpException e) {
                if (e.id != ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                    throw e;
                }
            }
        });
        return found[0];
    }

    @Override
    public ObjectMetadata getMetadata(StorageContext ctx, String storageKey) {
        SftpConfig cfg = config(ctx);
        long[] size = {0};
        withChannel(cfg, ch -> {
            com.jcraft.jsch.SftpATTRS attrs = ch.lstat(storageKey);
            size[0] = attrs.getSize();
        });
        return new ObjectMetadata(storageKey, size[0], null, null);
    }

    @Override
    public ConnectionTestResult testConnection(StorageContext ctx) {
        try {
            SftpConfig cfg = config(ctx);
            withChannel(cfg, ch -> {
                // Verify the remote directory exists and is accessible.
                try {
                    ch.ls(cfg.remoteDir());
                } catch (SftpException e) {
                    if (e.id == ChannelSftp.SSH_FX_NO_SUCH_FILE) {
                        throw new StorageException("Remote directory does not exist: " + cfg.remoteDir());
                    }
                    if (e.id == ChannelSftp.SSH_FX_PERMISSION_DENIED) {
                        throw new StorageException("Permission denied on directory: " + cfg.remoteDir());
                    }
                    throw e;
                }
            });
            return ConnectionTestResult.ok("Connected to " + cfg.host() + ":" + cfg.port() + " — directory verified.");
        } catch (StorageException e) {
            return ConnectionTestResult.fail(e.getMessage());
        } catch (Exception e) {
            return ConnectionTestResult.fail(friendlyError(e));
        }
    }

    // ------------------------------------------------------------------
    // Internal helpers
    // ------------------------------------------------------------------

    private record SftpConfig(String host, int port, String username, String password, String remoteDir) {}

    private SftpConfig config(StorageContext ctx) {
        String host = ctx.get("host");
        if (host == null || host.isBlank()) {
            throw new StorageException("SFTP host is required.");
        }
        String portStr = ctx.getOrDefault("port", "22");
        int port;
        try {
            port = Integer.parseInt(portStr.trim());
        } catch (NumberFormatException e) {
            throw new StorageException("Invalid SFTP port: " + portStr);
        }
        String username = ctx.get("username");
        if (username == null || username.isBlank()) {
            throw new StorageException("SFTP username is required.");
        }
        String password = ctx.get("password");
        if (password == null || password.isBlank()) {
            throw new StorageException("SFTP password is required.");
        }
        String remoteDir = ctx.getOrDefault("remoteDir", ".");
        if (remoteDir.isBlank()) {
            remoteDir = ".";
        }
        return new SftpConfig(host, port, username, password, remoteDir);
    }

    @FunctionalInterface
    private interface SftpAction {
        void run(ChannelSftp ch) throws Exception;
    }

    private void withChannel(SftpConfig cfg, SftpAction action) {
        Session session = null;
        ChannelSftp channel = null;
        try {
            JSch jsch = new JSch();
            session = jsch.getSession(cfg.username(), cfg.host(), cfg.port());
            session.setPassword(cfg.password());
            // Disable strict host-key checking for generic connectivity.
            // For production hardening, supply a known_hosts file instead.
            session.setConfig("StrictHostKeyChecking", "no");
            session.setTimeout(15_000);
            session.connect(15_000);

            channel = (ChannelSftp) session.openChannel("sftp");
            channel.connect(10_000);
            action.run(channel);
        } catch (StorageException e) {
            throw e;
        } catch (JSchException e) {
            throw new StorageException(friendlyError(e), e);
        } catch (SftpException e) {
            throw new StorageException("SFTP error: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new StorageException("SFTP operation failed: " + e.getMessage(), e);
        } finally {
            if (channel != null && channel.isConnected()) {
                channel.disconnect();
            }
            if (session != null && session.isConnected()) {
                session.disconnect();
            }
        }
    }

    private void ensureDir(ChannelSftp ch, String dir) throws SftpException {
        String[] parts = dir.replaceAll("^/+", "").split("/");
        StringBuilder path = new StringBuilder(dir.startsWith("/") ? "/" : "");
        for (String part : parts) {
            if (part.isBlank()) continue;
            path.append(part);
            try {
                ch.mkdir(path.toString());
            } catch (SftpException e) {
                // Servers return different codes for "already exists" (SSH_FX_FAILURE=4
                // on OpenSSH, SSH_FX_FILE_ALREADY_EXISTS=11 on MINA SSHD, etc.).
                // Safest approach: confirm the path is a reachable directory; re-throw only if not.
                try {
                    ch.lstat(path.toString());
                    // stat succeeded — directory exists, continue
                } catch (SftpException statEx) {
                    throw e; // original mkdir error was real
                }
            }
            path.append("/");
        }
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) return "file";
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    private static String friendlyError(Exception e) {
        String msg = e.getMessage();
        if (msg == null) return "Unknown SFTP error.";
        if (msg.contains("Auth fail") || msg.contains("Authentication failed")) {
            return "Authentication failed — check username / password.";
        }
        if (msg.contains("Connection refused")) {
            return "Connection refused — check host and port.";
        }
        if (msg.contains("UnknownHostException") || msg.contains("nodename nor servname")) {
            return "Unknown host — check the hostname.";
        }
        if (msg.contains("timeout") || msg.contains("Timeout")) {
            return "Connection timed out — host unreachable or firewall blocking port.";
        }
        return msg;
    }
}
