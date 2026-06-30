package com.project.filemanagement.storage.cloud;

import java.net.URI;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.stereotype.Component;

import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageProvider;
import com.project.filemanagement.storage.StorageProviderType;
import com.project.filemanagement.storage.StorageModels.ConnectionTestResult;
import com.project.filemanagement.storage.StorageModels.ObjectMetadata;
import com.project.filemanagement.storage.StorageModels.StorageException;
import com.project.filemanagement.storage.StorageModels.StoredContent;

/**
 * Amazon S3 provider implemented directly against the S3 REST API with a
 * self-contained AWS Signature V4 signer — no AWS SDK dependency (keeps the
 * build offline-friendly).
 *
 * <p>Settings: {@code bucket}, {@code region}, {@code accessKey},
 * {@code secretKey}, optional {@code endpoint} (defaults to the virtual-hosted
 * AWS endpoint).
 */
@Component
public class S3StorageProvider implements StorageProvider {

    private static final String SERVICE = "s3";
    private static final String ALGORITHM = "AWS4-HMAC-SHA256";

    private final CloudHttpSupport http;

    public S3StorageProvider(CloudHttpSupport http) {
        this.http = http;
    }

    @Override
    public StorageProviderType getType() {
        return StorageProviderType.S3;
    }

    private record S3Config(String bucket, String region, String accessKey, String secretKey, String host, String baseUrl) {
    }

    private S3Config config(StorageContext ctx) {
        String bucket = CloudHttpSupport.require(ctx.settings(), "bucket", "S3 bucket");
        String region = CloudHttpSupport.require(ctx.settings(), "region", "S3 region");
        String accessKey = CloudHttpSupport.require(ctx.settings(), "accessKey", "S3 access key");
        String secretKey = CloudHttpSupport.require(ctx.settings(), "secretKey", "S3 secret key");
        String endpoint = ctx.get("endpoint");
        String host;
        String baseUrl;
        if (endpoint != null && !endpoint.isBlank()) {
            baseUrl = endpoint.replaceAll("/+$", "");
            host = URI.create(baseUrl).getHost();
        } else {
            host = bucket + ".s3." + region + ".amazonaws.com";
            baseUrl = "https://" + host;
        }
        return new S3Config(bucket, region, accessKey, secretKey, host, baseUrl);
    }

    @Override
    public String upload(StorageContext ctx, String suggestedKey, byte[] data, String contentType) {
        S3Config cfg = config(ctx);
        String userSegment = (ctx.userEmail() == null ? "user" : ctx.userEmail()).replaceAll("[^a-zA-Z0-9._-]", "_");
        String key = userSegment + "/" + UUID.randomUUID() + "_" + sanitize(suggestedKey);
        byte[] body = data == null ? new byte[0] : data;

        HttpResponse<String> response = signedSend(cfg, "PUT", key, body, contentType);
        if (response.statusCode() / 100 != 2) {
            throw new StorageException("S3 upload failed (" + response.statusCode() + "): "
                    + CloudHttpSupport.shorten(response.body()));
        }
        return key;
    }

    @Override
    public StoredContent download(StorageContext ctx, String storageKey) {
        S3Config cfg = config(ctx);
        HttpRequest request = signedRequest(cfg, "GET", storageKey, new byte[0], null);
        HttpResponse<byte[]> response = http.sendBytes(request);
        if (response.statusCode() / 100 != 2) {
            throw new StorageException("S3 download failed (" + response.statusCode() + ")");
        }
        String ct = response.headers().firstValue("Content-Type").orElse(null);
        return new StoredContent(response.body(), ct);
    }

    @Override
    public void delete(StorageContext ctx, String storageKey) {
        S3Config cfg = config(ctx);
        HttpResponse<String> response = signedSend(cfg, "DELETE", storageKey, new byte[0], null);
        if (response.statusCode() / 100 != 2 && response.statusCode() != 404) {
            throw new StorageException("S3 delete failed (" + response.statusCode() + ")");
        }
    }

    @Override
    public boolean exists(StorageContext ctx, String storageKey) {
        S3Config cfg = config(ctx);
        HttpResponse<String> response = signedSend(cfg, "HEAD", storageKey, new byte[0], null);
        return response.statusCode() / 100 == 2;
    }

    @Override
    public ObjectMetadata getMetadata(StorageContext ctx, String storageKey) {
        S3Config cfg = config(ctx);
        HttpResponse<String> response = signedSend(cfg, "HEAD", storageKey, new byte[0], null);
        if (response.statusCode() / 100 != 2) {
            throw new StorageException("S3 metadata failed (" + response.statusCode() + ")");
        }
        long size = response.headers().firstValueAsLong("Content-Length").orElse(0L);
        String ct = response.headers().firstValue("Content-Type").orElse(null);
        String etag = response.headers().firstValue("ETag").orElse(null);
        return new ObjectMetadata(storageKey, size, ct, etag == null ? null : etag.replace("\"", ""));
    }

    @Override
    public ConnectionTestResult testConnection(StorageContext ctx) {
        try {
            S3Config cfg = config(ctx);
            // HEAD the bucket root to validate credentials + bucket existence.
            HttpResponse<String> response = signedSend(cfg, "HEAD", "", new byte[0], null);
            int sc = response.statusCode();
            if (sc / 100 == 2) {
                return ConnectionTestResult.ok("Bucket reachable: " + cfg.bucket());
            }
            if (sc == 403) {
                return ConnectionTestResult.fail("Access denied — check access key / secret / permissions.");
            }
            if (sc == 404) {
                return ConnectionTestResult.fail("Bucket not found: " + cfg.bucket());
            }
            return ConnectionTestResult.fail("S3 responded " + sc);
        } catch (Exception e) {
            return ConnectionTestResult.fail(e.getMessage());
        }
    }

    // ------------------------------------------------------------------
    // SigV4 signing
    // ------------------------------------------------------------------

    private HttpResponse<String> signedSend(S3Config cfg, String method, String key, byte[] body, String contentType) {
        HttpRequest request = signedRequest(cfg, method, key, body, contentType);
        return http.sendString(request);
    }

    private HttpRequest signedRequest(S3Config cfg, String method, String key, byte[] body, String contentType) {
        try {
            ZonedDateTime now = ZonedDateTime.now(ZoneOffset.UTC);
            String amzDate = now.format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'"));
            String dateStamp = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

            String canonicalUri = "/" + encodeKey(key);
            String payloadHash = hex(sha256(body));

            StringBuilder canonicalHeaders = new StringBuilder()
                    .append("host:").append(cfg.host()).append('\n')
                    .append("x-amz-content-sha256:").append(payloadHash).append('\n')
                    .append("x-amz-date:").append(amzDate).append('\n');
            String signedHeaders = "host;x-amz-content-sha256;x-amz-date";

            String canonicalRequest = method + "\n"
                    + canonicalUri + "\n"
                    + "" + "\n"
                    + canonicalHeaders + "\n"
                    + signedHeaders + "\n"
                    + payloadHash;

            String scope = dateStamp + "/" + cfg.region() + "/" + SERVICE + "/aws4_request";
            String stringToSign = ALGORITHM + "\n" + amzDate + "\n" + scope + "\n" + hex(sha256(canonicalRequest.getBytes(StandardCharsets.UTF_8)));

            byte[] signingKey = signatureKey(cfg.secretKey(), dateStamp, cfg.region(), SERVICE);
            String signature = hex(hmac(signingKey, stringToSign));

            String authorization = ALGORITHM + " Credential=" + cfg.accessKey() + "/" + scope
                    + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature;

            HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(cfg.baseUrl() + canonicalUri))
                    .header("x-amz-date", amzDate)
                    .header("x-amz-content-sha256", payloadHash)
                    .header("Authorization", authorization);
            if (contentType != null && !contentType.isBlank()) {
                builder.header("Content-Type", contentType);
            }

            switch (method) {
                case "PUT" -> builder.PUT(HttpRequest.BodyPublishers.ofByteArray(body));
                case "DELETE" -> builder.DELETE();
                case "HEAD" -> builder.method("HEAD", HttpRequest.BodyPublishers.noBody());
                default -> builder.GET();
            }
            return builder.build();
        } catch (Exception e) {
            throw new StorageException("S3 signing failed: " + e.getMessage(), e);
        }
    }

    private static String encodeKey(String key) {
        if (key == null || key.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        String[] segments = key.split("/");
        for (int i = 0; i < segments.length; i++) {
            if (i > 0) {
                sb.append('/');
            }
            sb.append(CloudHttpSupport.enc(segments[i]).replace("+", "%20"));
        }
        return sb.toString();
    }

    private static byte[] sha256(byte[] data) throws Exception {
        return MessageDigest.getInstance("SHA-256").digest(data);
    }

    private static byte[] hmac(byte[] key, String data) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key, "HmacSHA256"));
        return mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
    }

    private static byte[] signatureKey(String secretKey, String dateStamp, String region, String service) throws Exception {
        byte[] kDate = hmac(("AWS4" + secretKey).getBytes(StandardCharsets.UTF_8), dateStamp);
        byte[] kRegion = hmac(kDate, region);
        byte[] kService = hmac(kRegion, service);
        return hmac(kService, "aws4_request");
    }

    private static String hex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    private static String sanitize(String name) {
        if (name == null || name.isBlank()) {
            return "object";
        }
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
