package com.project.filemanagement.storage.cloud;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.filemanagement.storage.StorageModels.StorageException;

/**
 * Shared HTTP + OAuth helper for the cloud storage providers. Uses the JDK
 * {@link HttpClient} and Jackson only (no provider SDKs), so the cloud providers
 * compile and run without extra dependencies.
 */
@Component
public class CloudHttpSupport {

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    private final ObjectMapper mapper = new ObjectMapper();

    public HttpClient client() {
        return http;
    }

    public ObjectMapper mapper() {
        return mapper;
    }

    public JsonNode parse(String body) {
        try {
            return mapper.readTree(body);
        } catch (Exception e) {
            throw new StorageException("Invalid JSON response from provider", e);
        }
    }

    /**
     * Exchanges an OAuth2 refresh token for a fresh access token at the given
     * token endpoint. Works for both Google and Microsoft identity endpoints.
     */
    public String refreshAccessToken(
            String tokenEndpoint,
            String clientId,
            String clientSecret,
            String refreshToken,
            String scope
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new StorageException("Missing OAuth refresh token");
        }
        StringBuilder form = new StringBuilder()
                .append("client_id=").append(enc(clientId))
                .append("&grant_type=refresh_token")
                .append("&refresh_token=").append(enc(refreshToken));
        if (clientSecret != null && !clientSecret.isBlank()) {
            form.append("&client_secret=").append(enc(clientSecret));
        }
        if (scope != null && !scope.isBlank()) {
            form.append("&scope=").append(enc(scope));
        }

        HttpRequest request = HttpRequest.newBuilder(URI.create(tokenEndpoint))
                .header("Content-Type", "application/x-www-form-urlencoded")
                .timeout(Duration.ofSeconds(20))
                .POST(HttpRequest.BodyPublishers.ofString(form.toString()))
                .build();

        try {
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                throw new StorageException("Token refresh failed (" + response.statusCode() + "): "
                        + shorten(response.body()));
            }
            JsonNode node = parse(response.body());
            JsonNode token = node.get("access_token");
            if (token == null || token.asText().isBlank()) {
                throw new StorageException("Token endpoint returned no access_token");
            }
            return token.asText();
        } catch (StorageException e) {
            throw e;
        } catch (Exception e) {
            throw new StorageException("Token refresh error: " + e.getMessage(), e);
        }
    }

    public HttpResponse<byte[]> sendBytes(HttpRequest request) {
        try {
            return http.send(request, HttpResponse.BodyHandlers.ofByteArray());
        } catch (Exception e) {
            throw new StorageException("HTTP request failed: " + e.getMessage(), e);
        }
    }

    public HttpResponse<String> sendString(HttpRequest request) {
        try {
            return http.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            throw new StorageException("HTTP request failed: " + e.getMessage(), e);
        }
    }

    public static String enc(String value) {
        return URLEncoder.encode(value == null ? "" : value, StandardCharsets.UTF_8);
    }

    public static String require(Map<String, String> settings, String key, String label) {
        String v = settings == null ? null : settings.get(key);
        if (v == null || v.isBlank()) {
            throw new StorageException("Missing required setting: " + label);
        }
        return v;
    }

    public static String shorten(String body) {
        if (body == null) {
            return "";
        }
        return body.length() > 300 ? body.substring(0, 300) + "…" : body;
    }
}
