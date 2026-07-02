package com.project.filemanagement.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.dto.AdminFilePreviewResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.service.compression.CompressorFactory;
import com.project.filemanagement.service.compression.FileCompressor;
import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageProviderRegistry;
import com.project.filemanagement.storage.StorageProviderType;

/**
 * Serves file bytes for preview/download and exposes helpers used by the
 * preview/streaming layer. Object-level access checks are delegated to
 * FileAccessService so access rules are defined in one place.
 */
@Service
public class FileContentService {

    private final FileRepository fileRepository;
    private final FileCompressionService fileCompressionService;
    private final FileAccessService fileAccessService;
    private final CompressorFactory compressorFactory;
    private final UserStorageSettingsService storageSettingsService;
    private final StorageProviderRegistry storageRegistry;

    public FileContentService(
            FileRepository fileRepository,
            FileCompressionService fileCompressionService,
            FileAccessService fileAccessService,
            CompressorFactory compressorFactory,
            UserStorageSettingsService storageSettingsService,
            StorageProviderRegistry storageRegistry
    ) {
        this.fileRepository = fileRepository;
        this.fileCompressionService = fileCompressionService;
        this.fileAccessService = fileAccessService;
        this.compressorFactory = compressorFactory;
        this.storageSettingsService = storageSettingsService;
        this.storageRegistry = storageRegistry;
    }

    /**
     * Returns the file's served bytes, routing to the correct storage backend.
     * LOCAL files are read from the DB blob (and decompressed as before); cloud
     * files are fetched from their provider (stored raw, no decompression).
     */
    private byte[] resolveContentBytes(FileEntity file) {
        StorageProviderType type = StorageProviderType.fromString(file.getStorageProvider());
        if (type != StorageProviderType.LOCAL && file.getStorageKey() != null) {
            StorageContext ctx = storageSettingsService.contextFor(file.getOwner(), type);
            return storageRegistry.get(type).download(ctx, file.getStorageKey()).data();
        }
        return decompressedBytes(file);
    }

    public ResponseEntity<byte[]> serveFileContent(Long fileId, String userEmail, boolean downloadMode) {

        FileEntity file = fileAccessService.authorize(fileId, userEmail);

        byte[] outputBytes = resolveContentBytes(file);
        MediaType mediaType = resolveServedMediaType(file);

        // Defence in depth against stored XSS: HTML content must never render
        // inline in the browser, so force it to download regardless of preview
        // mode. PDFs, audio and video keep their existing inline preview.
        boolean forceAttachment = downloadMode || isHtml(mediaType, file.getContentType());
        String disposition = forceAttachment ? "attachment" : "inline";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + file.getFileName() + "\"")
                .header("X-Content-Type-Options", "nosniff")
                .contentType(mediaType)
                .contentLength(outputBytes.length)
                .body(outputBytes);
    }

    /**
     * Content-Type for the bytes we actually serve. Video uploads are always
     * transcoded to H.264/AAC MP4 by {@code VideoCompressor} (algorithm
     * {@code FFMPEG_VIDEO}), so the stored bytes are MP4 regardless of the
     * original container. The stored {@code contentType} still holds the
     * ORIGINAL MIME (e.g. video/webm), which would mislabel the served MP4 and
     * break native &lt;video&gt; playback on strict browsers. For those rows we
     * report {@code video/mp4}, the true type of the bytes; everything else
     * keeps its stored/looked-up type.
     */
    private static MediaType resolveServedMediaType(FileEntity file) {
        if ("FFMPEG_VIDEO".equalsIgnoreCase(file.getCompressionAlgorithm())) {
            return MediaType.parseMediaType("video/mp4");
        }
        return resolveMediaType(file.getContentType(), file.getFileType());
    }

    /** True when the response would carry HTML, which must never render inline. */
    private static boolean isHtml(MediaType mediaType, String storedContentType) {

        if (mediaType != null
                && "text".equalsIgnoreCase(mediaType.getType())
                && "html".equalsIgnoreCase(mediaType.getSubtype())) {
            return true;
        }

        return storedContentType != null
                && storedContentType.toLowerCase().contains("html");
    }

    /**
     * Returns the decompressed text of a file after a view-permission check.
     * Used by the Markdown preview renderer.
     */
    public String loadDecompressedText(Long fileId, String userEmail) {
        FileEntity file = fileAccessService.authorize(fileId, userEmail);
        return new String(resolveContentBytes(file), StandardCharsets.UTF_8);
    }

    /**
     * Returns the served bytes for a file entity, routing to the correct
     * storage backend (cloud or local DB). Exposed for use by other services
     * (e.g. streaming) that already hold a {@link FileEntity} and need the
     * provider-aware bytes without re-authorizing.
     */
    public byte[] resolveBytes(FileEntity file) {
        return resolveContentBytes(file);
    }




private byte[] decompressedBytes(FileEntity file) {

    byte[] storedBytes = file.getFileData();

    if (storedBytes == null) {
        return new byte[0];
    }

    boolean shouldDecompress =
        Boolean.TRUE.equals(file.getRequiresDecompression())
        || Boolean.TRUE.equals(file.getCompressed())
        || "GZIP".equalsIgnoreCase(file.getCompressionAlgorithm());


    if (!shouldDecompress) {
        return storedBytes;
    }

    File tempCompressedFile = null;
    File decompressedFile = null;

    try {

        String extension = file.getFileType();

        tempCompressedFile =
                File.createTempFile(
                        "sfms-download-",
                        "." + extension
                );

        Files.write(
                tempCompressedFile.toPath(),
                storedBytes
        );

        FileCompressor compressor =
                compressorFactory.getCompressor(extension);

        decompressedFile =
                compressor.decompress(tempCompressedFile);

        return Files.readAllBytes(
                decompressedFile.toPath()
        );

    } catch (IOException e) {

        throw new RuntimeException(
                "Unable to decompress file",
                e
        );

    } finally {

        try {

            if (tempCompressedFile != null) {
                Files.deleteIfExists(
                        tempCompressedFile.toPath()
                );
            }

            if (decompressedFile != null) {
                Files.deleteIfExists(
                        decompressedFile.toPath()
                );
            }

        } catch (IOException ignored) {
        }
    }
}
    /**
     * Resolves the response Content-Type. Prefers the MIME stored at upload
     * time; falls back to an extension guess for legacy rows that predate the
     * content_type column.
     */
    public static MediaType resolveMediaType(String storedContentType, String fileType) {

        if (storedContentType != null && !storedContentType.isBlank()) {
            try {
                return MediaType.parseMediaType(storedContentType);
            } catch (Exception ignored) {
                // fall through to extension-based guess
            }
        }

        String ext = fileType == null ? "" : fileType.toLowerCase();

        return switch (ext) {
            case "pdf" -> MediaType.APPLICATION_PDF;
            case "md", "txt" -> MediaType.parseMediaType("text/plain;charset=UTF-8");
            case "mp4" -> MediaType.parseMediaType("video/mp4");
            case "webm" -> MediaType.parseMediaType("video/webm");
            case "mov" -> MediaType.parseMediaType("video/quicktime");
            case "avi" -> MediaType.parseMediaType("video/x-msvideo");
            case "mkv" -> MediaType.parseMediaType("video/x-matroska");
            case "mp3" -> MediaType.parseMediaType("audio/mpeg");
            case "wav" -> MediaType.parseMediaType("audio/wav");
            case "m4a" -> MediaType.parseMediaType("audio/mp4");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };
    }

    public ResponseEntity<byte[]> adminDownloadFile(Long fileId) {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        byte[] outputBytes = resolveContentBytes(file);
        MediaType mediaType = resolveMediaType(file.getContentType(), file.getFileType());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getFileName() + "\"")
                .contentType(mediaType)
                .contentLength(outputBytes.length)
                .body(outputBytes);
    }

public AdminFilePreviewResponse adminPreviewFile(Long fileId) {

    FileEntity file = fileRepository.findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "File not found"
            ));

    String contentType = file.getContentType() == null
            ? ""
            : file.getContentType().toLowerCase();

    String fileType = file.getFileType() == null
            ? ""
            : file.getFileType().toLowerCase();

    boolean isText =
            contentType.startsWith("text/")
            || "txt".equals(fileType)
            || "md".equals(fileType);

    String content = isText
            ? new String(resolveContentBytes(file), StandardCharsets.UTF_8)
            : "[Binary file — "
            + (file.getContentType() == null
                    ? "unknown type"
                    : file.getContentType())
            + ". Use download to view.]";

    return new AdminFilePreviewResponse(
            file.getFileName(),
            file.getOwner().getFullName(),
            file.getOwner().getEmail(),
            content
    );
}
}
