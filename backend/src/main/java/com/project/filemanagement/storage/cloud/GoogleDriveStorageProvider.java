package com.project.filemanagement.storage.cloud;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageProvider;
import com.project.filemanagement.storage.StorageProviderType;
import com.project.filemanagement.storage.StorageModels.ConnectionTestResult;
import com.project.filemanagement.storage.StorageModels.ObjectMetadata;
import com.project.filemanagement.storage.StorageModels.StorageException;
import com.project.filemanagement.storage.StorageModels.StoredContent;

/**
 * Google Drive provider via the Drive v3 REST API. Authenticates with the user's
 * stored OAuth refresh token (exchanged for a short-lived access token on each
 * call); no Google SDK dependency.
 *
 * <p>Settings: {@code refreshToken}, {@code clientId}, {@code clientSecret}.
 */
@Component
public class GoogleDriveStorageProvider implements StorageProvider {

    private static final String TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
    private static final String UPLOAD_URL =
            "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
    private static final String FILES_URL = "https://www.googleapis.com/drive/v3/files/";
    private static final String ABOUT_URL = "https://www.googleapis.com/drive/v3/about?fields=user";

    private final CloudHttpSupport http;

    public GoogleDriveStorageProvider(CloudHttpSupport http) {
        this.http = http;
    }

    @Override
    public StorageProviderType getType() {
        return StorageProviderType.GOOGLE_DRIVE;
    }

    private String accessToken(StorageContext ctx) {
        return http.refreshAccessToken(
                TOKEN_ENDPOINT,
                ctx.get("clientId"),
                ctx.get("clientSecret"),
                ctx.get("refreshToken"),
                null);
    }

    @Override
    public String upload(StorageContext ctx, String suggestedKey, byte[] data, String contentType) {
        String token = accessToken(ctx);
        String boundary = "sfms_" + System.nanoTime();
        String meta = "{\"name\":\"" + escape(suggestedKey) + "\"}";
        String ct = contentType == null ? "application/octet-stream" : contentType;

        var head = ("--" + boundary + "\r\n"
                + "Content-Type: application/json; charset=UTF-8\r\n\r\n"
                + meta + "\r\n"
                + "--" + boundary + "\r\n"
                + "Content-Type: " + ct + "\r\n\r\n").getBytes(StandardCharsets.UTF_8);
        var tail = ("\r\n--" + boundary + "--").getBytes(StandardCharsets.UTF_8);

        byte[] body = concat(head, data == null ? new byte[0] : data, tail);

        HttpRequest request = HttpRequest.newBuilder(URI.create(UPLOAD_URL))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "multipart/related; boundary=" + boundary)
                .POST(HttpRequest.BodyPublishers.ofByteArray(body))
                .build();

        HttpResponse<String> response = http.sendString(request);
        if (response.statusCode() / 100 != 2) {
            throw new StorageException("Drive upload failed (" + response.statusCode() + "): "
                    + CloudHttpSupport.shorten(response.body()));
        }
        JsonNode node = http.parse(response.body());
        JsonNode id = node.get("id");
        if (id == null) {
            throw new StorageException("Drive upload returned no file id");
        }
        return id.asText();
    }

    @Override
    public StoredContent download(StorageContext ctx, String storageKey) {
        String token = accessToken(ctx);
        HttpRequest request = HttpRequest.newBuilder(URI.create(FILES_URL + storageKey + "?alt=media"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<byte[]> response = http.sendBytes(request);
        if (response.statusCode() / 100 != 2) {
            throw new StorageException("Drive download failed (" + response.statusCode() + ")");
        }
        String ct = response.headers().firstValue("Content-Type").orElse(null);
        return new StoredContent(response.body(), ct);
    }

    @Override
    public void delete(StorageContext ctx, String storageKey) {
        String token = accessToken(ctx);
        HttpRequest request = HttpRequest.newBuilder(URI.create(FILES_URL + storageKey))
                .header("Authorization", "Bearer " + token)
                .DELETE()
                .build();
        HttpResponse<String> response = http.sendString(request);
        if (response.statusCode() / 100 != 2 && response.statusCode() != 404) {
            throw new StorageException("Drive delete failed (" + response.statusCode() + ")");
        }
    }

    @Override
    public boolean exists(StorageContext ctx, String storageKey) {
        try {
            return getMetadata(ctx, storageKey) != null;
        } catch (StorageException e) {
            return false;
        }
    }

    @Override
    public ObjectMetadata getMetadata(StorageContext ctx, String storageKey) {
        String token = accessToken(ctx);
        HttpRequest request = HttpRequest.newBuilder(
                        URI.create(FILES_URL + storageKey + "?fields=id,size,mimeType,md5Checksum"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> response = http.sendString(request);
        if (response.statusCode() / 100 != 2) {
            throw new StorageException("Drive metadata failed (" + response.statusCode() + ")");
        }
        JsonNode node = http.parse(response.body());
        long size = node.hasNonNull("size") ? node.get("size").asLong() : 0L;
        String mime = node.hasNonNull("mimeType") ? node.get("mimeType").asText() : null;
        String md5 = node.hasNonNull("md5Checksum") ? node.get("md5Checksum").asText() : null;
        return new ObjectMetadata(storageKey, size, mime, md5);
    }

    @Override
    public ConnectionTestResult testConnection(StorageContext ctx) {
        try {
            String token = accessToken(ctx);
            HttpRequest request = HttpRequest.newBuilder(URI.create(ABOUT_URL))
                    .header("Authorization", "Bearer " + token)
                    .GET()
                    .build();
            HttpResponse<String> response = http.sendString(request);
            if (response.statusCode() / 100 == 2) {
                return ConnectionTestResult.ok("Google Drive connected");
            }
            return ConnectionTestResult.fail("Drive responded " + response.statusCode() + ": "
                    + CloudHttpSupport.shorten(response.body()));
        } catch (Exception e) {
            return ConnectionTestResult.fail(e.getMessage());
        }
    }

    private static String escape(String s) {
        return s == null ? "object" : s.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private static byte[] concat(byte[]... parts) {
        int len = 0;
        for (byte[] p : parts) {
            len += p.length;
        }
        byte[] out = new byte[len];
        int pos = 0;
        for (byte[] p : parts) {
            System.arraycopy(p, 0, out, pos, p.length);
            pos += p.length;
        }
        return out;
    }
}
