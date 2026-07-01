package com.project.filemanagement.storage.cloud;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

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
 * Microsoft OneDrive provider via the Microsoft Graph REST API. Authenticates
 * with the user's stored OAuth refresh token; no Microsoft SDK dependency.
 *
 * <p>Settings: {@code refreshToken}, {@code clientId}, {@code clientSecret}.
 */
@Component
public class OneDriveStorageProvider implements StorageProvider {

    private static final String TOKEN_ENDPOINT =
            "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    private static final String GRAPH = "https://graph.microsoft.com/v1.0";
    private static final String SCOPE = "https://graph.microsoft.com/.default offline_access";

    private final CloudHttpSupport http;

    public OneDriveStorageProvider(CloudHttpSupport http) {
        this.http = http;
    }

    @Override
    public StorageProviderType getType() {
        return StorageProviderType.ONEDRIVE;
    }

    private String accessToken(StorageContext ctx) {
        return http.refreshAccessToken(
                TOKEN_ENDPOINT,
                ctx.get("clientId"),
                ctx.get("clientSecret"),
                ctx.get("refreshToken"),
                SCOPE);
    }

    @Override
    public String upload(StorageContext ctx, String suggestedKey, byte[] data, String contentType) {
        String token = accessToken(ctx);
        // Simple upload (files up to a few MB). Path under the app folder root.
        String path = "/me/drive/root:/" + CloudHttpSupport.enc(sanitize(suggestedKey)) + ":/content";
        HttpRequest request = HttpRequest.newBuilder(URI.create(GRAPH + path))
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", contentType == null ? "application/octet-stream" : contentType)
                .PUT(HttpRequest.BodyPublishers.ofByteArray(data == null ? new byte[0] : data))
                .build();
        HttpResponse<String> response = http.sendString(request);
        if (response.statusCode() / 100 != 2) {
            throw new StorageException("OneDrive upload failed (" + response.statusCode() + "): "
                    + CloudHttpSupport.shorten(response.body()));
        }
        JsonNode node = http.parse(response.body());
        JsonNode id = node.get("id");
        if (id == null) {
            throw new StorageException("OneDrive upload returned no item id");
        }
        return id.asText();
    }

    @Override
    public StoredContent download(StorageContext ctx, String storageKey) {
        String token = accessToken(ctx);
        HttpRequest request = HttpRequest.newBuilder(URI.create(GRAPH + "/me/drive/items/" + storageKey + "/content"))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<byte[]> response = http.sendBytes(request);
        if (response.statusCode() / 100 != 2) {
            throw new StorageException("OneDrive download failed (" + response.statusCode() + ")");
        }
        String ct = response.headers().firstValue("Content-Type").orElse(null);
        return new StoredContent(response.body(), ct);
    }

    @Override
    public void delete(StorageContext ctx, String storageKey) {
        String token = accessToken(ctx);
        HttpRequest request = HttpRequest.newBuilder(URI.create(GRAPH + "/me/drive/items/" + storageKey))
                .header("Authorization", "Bearer " + token)
                .DELETE()
                .build();
        HttpResponse<String> response = http.sendString(request);
        if (response.statusCode() / 100 != 2 && response.statusCode() != 404) {
            throw new StorageException("OneDrive delete failed (" + response.statusCode() + ")");
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
        HttpRequest request = HttpRequest.newBuilder(URI.create(GRAPH + "/me/drive/items/" + storageKey))
                .header("Authorization", "Bearer " + token)
                .GET()
                .build();
        HttpResponse<String> response = http.sendString(request);
        if (response.statusCode() / 100 != 2) {
            throw new StorageException("OneDrive metadata failed (" + response.statusCode() + ")");
        }
        JsonNode node = http.parse(response.body());
        long size = node.hasNonNull("size") ? node.get("size").asLong() : 0L;
        String mime = node.path("file").path("mimeType").asText(null);
        return new ObjectMetadata(storageKey, size, mime, null);
    }

    @Override
    public ConnectionTestResult testConnection(StorageContext ctx) {
        try {
            String token = accessToken(ctx);
            HttpRequest request = HttpRequest.newBuilder(URI.create(GRAPH + "/me/drive"))
                    .header("Authorization", "Bearer " + token)
                    .GET()
                    .build();
            HttpResponse<String> response = http.sendString(request);
            if (response.statusCode() / 100 == 2) {
                return ConnectionTestResult.ok("OneDrive connected");
            }
            return ConnectionTestResult.fail("OneDrive responded " + response.statusCode() + ": "
                    + CloudHttpSupport.shorten(response.body()));
        } catch (Exception e) {
            return ConnectionTestResult.fail(e.getMessage());
        }
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) {
            return "object";
        }
        return name.replaceAll("[\\\\/:*?\"<>|]", "_");
    }
}
