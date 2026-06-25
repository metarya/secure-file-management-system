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

    public FileContentService(
            FileRepository fileRepository,
            FileCompressionService fileCompressionService,
            FileAccessService fileAccessService,
            CompressorFactory compressorFactory
    ) {
        this.fileRepository = fileRepository;
        this.fileCompressionService = fileCompressionService;
        this.fileAccessService = fileAccessService;
        this.compressorFactory = compressorFactory;

    }

    public ResponseEntity<byte[]> serveFileContent(Long fileId, String userEmail, boolean downloadMode) {

        FileEntity file = fileAccessService.authorize(fileId, userEmail);

        byte[] outputBytes = decompressedBytes(file);
        String disposition = downloadMode ? "attachment" : "inline";
        MediaType mediaType = resolveMediaType(file.getContentType(), file.getFileType());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition + "; filename=\"" + file.getFileName() + "\"")
                .contentType(mediaType)
                .contentLength(outputBytes.length)
                .body(outputBytes);
    }

    /**
     * Returns the decompressed text of a file after a view-permission check.
     * Used by the Markdown preview renderer.
     */
    public String loadDecompressedText(Long fileId, String userEmail) {
        FileEntity file = fileAccessService.authorize(fileId, userEmail);
        return new String(decompressedBytes(file), StandardCharsets.UTF_8);
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

        byte[] outputBytes = decompressedBytes(file);
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
            ? new String(decompressedBytes(file), StandardCharsets.UTF_8)
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
