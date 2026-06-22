package com.project.filemanagement.service;

import java.nio.charset.StandardCharsets;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.dto.AdminFilePreviewResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserRepository;

/**
 * Serves file bytes for preview/download and exposes helpers used by the
 * preview/streaming layer. Permission checks are delegated to
 * FileSharingService so access rules are defined in one place.
 */
@Service
public class FileContentService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FileCompressionService fileCompressionService;
    private final FileSharingService fileSharingService;

    public FileContentService(
            FileRepository fileRepository,
            UserRepository userRepository,
            FileCompressionService fileCompressionService,
            FileSharingService fileSharingService
    ) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.fileCompressionService = fileCompressionService;
        this.fileSharingService = fileSharingService;
    }

    public ResponseEntity<byte[]> serveFileContent(Long fileId, String userEmail, boolean downloadMode) {

        FileEntity file = authorize(fileId, userEmail, downloadMode);

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
        FileEntity file = authorize(fileId, userEmail, false);
        return new String(decompressedBytes(file), StandardCharsets.UTF_8);
    }

    /**
     * Validates the request, resolves the user/file and enforces access.
     * downloadMode currently shares the same VIEWER/EDITOR rule as preview;
     * kept as a parameter so the two messages stay distinct.
     */
private FileEntity authorize(Long fileId, String userEmail, boolean downloadMode) {

    if (fileId == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
    }

    if (userEmail == null || userEmail.isBlank()) {
        throw new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "Authenticated user email is required"
        );
    }

    User user = userRepository.findByEmail(userEmail.trim())
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Authenticated user not found"
            ));

    FileEntity file = fileRepository.findById(fileId)
            .orElseThrow(() -> new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "File not found"
            ));

    // Soft-deleted files should not be accessible to normal users
    if (Boolean.TRUE.equals(file.getDeleted())) {
        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                "File not found"
        );
    }

    boolean isOwner = file.getOwner().getId().equals(user.getId());
    boolean isPublic = "PUBLIC".equalsIgnoreCase(file.getVisibility());
    boolean hasAccess = fileSharingService.hasSharedPermission(
            file,
            user,
            "VIEWER",
            "EDITOR"
    );

    if (!(isOwner || isPublic || hasAccess)) {
        throw new ResponseStatusException(
                HttpStatus.FORBIDDEN,
                downloadMode
                        ? "You only have view access. Download is not allowed."
                        : "You are not allowed to preview this file"
        );
    }

    return file;
}




    private byte[] decompressedBytes(FileEntity file) {
        byte[] storedBytes = file.getFileData();
        if (storedBytes == null) {
            return new byte[0];
        }
        return Boolean.TRUE.equals(file.getCompressed())
                ? fileCompressionService.decompressBytes(storedBytes)
                : storedBytes;
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
