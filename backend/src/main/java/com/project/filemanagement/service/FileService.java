package com.project.filemanagement.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.apache.tika.Tika;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.dto.AdminFilePreviewResponse;
import com.project.filemanagement.dto.FileListResponse;
import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.dto.ShareFileRequest;
import com.project.filemanagement.dto.ShareFileResponse;
import com.project.filemanagement.dto.SharedWithMeFileResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.exception.BadRequestException;
import com.project.filemanagement.exception.ForbiddenException;
import com.project.filemanagement.exception.ResourceNotFoundException;
import com.project.filemanagement.repository.FilePermissionRepository;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.service.compression.CompressionResult;
import com.project.filemanagement.service.streaming.HlsService;

import lombok.extern.slf4j.Slf4j;

/**
 * Core file service: upload, listing/search, metadata (rename, description,
 * visibility, content edit) and admin file actions. Sharing, content serving,
 * streaming and markdown rendering are delegated to dedicated services.
 */
@Slf4j
@Service
public class FileService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FilePermissionRepository filePermissionRepository;
    private final AuditLogService auditLogService;
    private final FileValidationService fileValidationService;
    private final FileCompressionService fileCompressionService;
    private final FileHashService fileHashService;
    private final FileContentService fileContentService;
    private final FileSharingService fileSharingService;
    private final FileStreamingService fileStreamingService;
    private final MarkdownService markdownService;
    private final Tika tika;
    private final HlsService hlsService;

    public FileService(
            FileRepository fileRepository,
            UserRepository userRepository,
            FilePermissionRepository filePermissionRepository,
            AuditLogService auditLogService,
            FileValidationService fileValidationService,
            FileCompressionService fileCompressionService,
            FileHashService fileHashService,
            FileContentService fileContentService,
            FileSharingService fileSharingService,
            FileStreamingService fileStreamingService,
            MarkdownService markdownService,
            HlsService hlsService
    ) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.filePermissionRepository = filePermissionRepository;
        this.auditLogService = auditLogService;
        this.fileValidationService = fileValidationService;
        this.fileCompressionService = fileCompressionService;
        this.fileHashService = fileHashService;
        this.fileContentService = fileContentService;
        this.fileSharingService = fileSharingService;
        this.fileStreamingService = fileStreamingService;
        this.markdownService = markdownService;
        this.hlsService = hlsService;
        this.tika = new Tika();
    }

    // ----------------------------------------------------------------------
    // Upload
    // ----------------------------------------------------------------------

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId) {
        return uploadFile(file, ownerId, null);
    }

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId, String description) {

        // 1. Verify that ownerId is provided and owner user exists.
        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        // 2. Reject null or empty files.
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is empty");
        }

        // 3. Read original file name.
        String originalFileName = file.getOriginalFilename();

        if (originalFileName == null || originalFileName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name is required");
        }

        // 4. Extract + validate extension.
        String fileType = fileValidationService.getFileExtension(originalFileName);

        if (!fileValidationService.isAllowedFileType(fileType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "File type not supported: ." + fileType
            );
        }

        // 5. Read actual uploaded bytes once.
        byte[] originalBytes;

        try {
            originalBytes = file.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("Unable to read uploaded file content", e);
        }

        // 6. Detect the real MIME type from bytes and validate it (blocks
        //    files whose real content doesn't match an allowed type, e.g. an
        //    executable renamed to .mp4).
        String detectedMimeType = tika.detect(originalBytes, originalFileName);

        if (!fileValidationService.isAllowedDetectedMimeType(detectedMimeType)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Invalid file content. Detected type: " + detectedMimeType
            );
        }

        boolean isText = detectedMimeType.toLowerCase().startsWith("text/");

        // 7. Scan for suspicious patterns — text files only (a PDF/audio/video
        //    byte stream is not UTF-8 text, so scanning it is meaningless).
        if (isText) {
            String textContent = new String(originalBytes, StandardCharsets.UTF_8);

            if (fileValidationService.containsSuspiciousContent(textContent)) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Suspicious file content detected. Upload rejected"
                );
            }
        }

        // 8. SHA-256 for duplicate detection.
        String fileHash = fileHashService.generateSha256Hash(originalBytes);

        if (fileRepository.existsByOwnerAndFileHashAndDeletedFalse(owner, fileHash)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Duplicate file detected. This file was already uploaded by the same user"
            );
        }

        Path tempInputPath = null;
        File compressedFile = null;
        byte[] storedBytes;
        CompressionResult compressionResult;

try {

    tempInputPath = Files.createTempFile("sfms-upload-", "-" + originalFileName);

    Files.write(tempInputPath, originalBytes);

    compressionResult =
            fileCompressionService.compress(tempInputPath.toFile(),fileType);

            compressedFile = compressionResult.getCompressedFile();

    storedBytes =
            Files.readAllBytes(
                    compressionResult.getCompressedFile().toPath()
            );

} catch (IOException e) {

    throw new RuntimeException(
            "Unable to compress uploaded file",
            e
    );

} 

finally {

    try {

        if (tempInputPath != null) {
            Files.deleteIfExists(tempInputPath);
        }

    } catch (IOException ignored) {
    }
}


        // 10. Persist metadata + bytes.
        FileEntity fileEntity = new FileEntity();
        fileEntity.setOwner(owner);
        fileEntity.setFileName(originalFileName);
        fileEntity.setFileType(fileType);
        fileEntity.setContentType(detectedMimeType);
        fileEntity.setDescription(fileValidationService.cleanDescription(description));
        fileEntity.setFileSize(file.getSize());
        fileEntity.setFileHash(fileHash);
        fileEntity.setOriginalFileSize(
        compressionResult.getOriginalSize());

fileEntity.setCompressedFileSize(
        compressionResult.getCompressedSize());

fileEntity.setCompressed(
        compressionResult.getCompressedSize()
                < compressionResult.getOriginalSize());

fileEntity.setCompressionAlgorithm(
        compressionResult.getAlgorithm());

fileEntity.setRequiresDecompression(
        compressionResult.isRequiresDecompression());
        fileEntity.setVisibility("PRIVATE");
        fileEntity.setFileData(storedBytes);

FileEntity savedFile = fileRepository.save(fileEntity);

try {

    if ("FFMPEG_VIDEO".equals(compressionResult.getAlgorithm())) {

        hlsService.generateHls(
                compressionResult.getCompressedFile(),
                savedFile.getId()
        );

        savedFile.setHlsFolder(
                "uploads/hls/" + savedFile.getId()
        );

        savedFile.setHlsPlaylist(
                "uploads/hls/" + savedFile.getId() + "/master.m3u8"
        );

        savedFile.setHlsGenerated(true);

        fileRepository.save(savedFile);
    }

} catch (Exception e) {

    log.error("HLS generation failed for file {}", savedFile.getId(), e);

}

finally {

    try {

        if (compressedFile != null) {
            Files.deleteIfExists(compressedFile.toPath());
        }

    } catch (IOException ignored) {
    }

}

return new FileUploadResponse(
        "File uploaded successfully",
        savedFile.getId(),
        savedFile.getFileName(),
        savedFile.getFileType(),
        savedFile.getFileSize()
);
    }

    // ----------------------------------------------------------------------
    // Listing / search
    // ----------------------------------------------------------------------

    public List<FileListResponse> getMyFiles(Long ownerId) {

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        return fileRepository.findByOwner(owner)
                .stream()
                .filter(file -> !Boolean.TRUE.equals(file.getDeleted()))
                .map(this::mapToFileListResponse)
                .toList();
    }

    public List<FileListResponse> searchMyFiles(Long ownerId, String name) {

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        if (name == null || name.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Search keyword is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        return fileRepository.findByOwnerAndFileNameContainingIgnoreCase(owner, name)
                .stream()
                .filter(file -> !Boolean.TRUE.equals(file.getDeleted()))
                .map(this::mapToFileListResponse)
                .toList();
    }

    private FileListResponse mapToFileListResponse(FileEntity file) {

        return new FileListResponse(
                file.getId(),
                file.getFileName(),
                file.getDescription(),
                file.getFileType(),
                file.getFileSize(),
                file.getOriginalFileSize(),
                file.getCompressedFileSize(),
                file.getCompressed(),
                file.getVisibility(),
                file.getUploadedAt()
        );
    }

    // ----------------------------------------------------------------------
    // Preview / download / stream / markdown  (delegated)
    // ----------------------------------------------------------------------

    public ResponseEntity<byte[]> previewFile(Long fileId, String userEmail) {
        return fileContentService.serveFileContent(fileId, userEmail, false);
    }

    public ResponseEntity<byte[]> downloadFile(Long fileId, String userEmail) {
        return fileContentService.serveFileContent(fileId, userEmail, true);
    }

    public ResponseEntity<byte[]> streamFile(Long fileId, String userEmail, String rangeHeader) {
        return fileStreamingService.streamFile(fileId, userEmail, rangeHeader);
    }

    /** Renders a .md/.txt file to sanitized HTML for the in-app preview. */
    public String renderMarkdownPreview(Long fileId, String userEmail) {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        String type = file.getFileType() == null ? "" : file.getFileType().toLowerCase();

        if (!type.equals("md") && !type.equals("txt")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Markdown preview is only available for .md and .txt files"
            );
        }

        String markdown = fileContentService.loadDecompressedText(fileId, userEmail);
        return markdownService.renderToHtml(markdown);
    }

    public ResponseEntity<byte[]> adminDownloadFile(Long fileId) {
        return fileContentService.adminDownloadFile(fileId);
    }

    public AdminFilePreviewResponse adminPreviewFile(Long fileId) {
        return fileContentService.adminPreviewFile(fileId);
    }

    // ----------------------------------------------------------------------
    // Sharing  (delegated to FileSharingService)
    // ----------------------------------------------------------------------

    public ShareFileResponse shareFile(ShareFileRequest request, String ownerEmail) {
        return fileSharingService.shareFile(request, ownerEmail);
    }

    public List<SharedWithMeFileResponse> getSharedWithMeFiles(String userEmail) {
        return fileSharingService.getSharedWithMeFiles(userEmail);
    }

    public String removeSharedFileFromMyList(Long fileId, String userEmail) {
        return fileSharingService.removeSharedFileFromMyList(fileId, userEmail);
    }

    public String removeSharedPermissionFromMyList(Long permissionId, String userEmail) {
        return fileSharingService.removeSharedPermissionFromMyList(permissionId, userEmail);
    }

    public String removeSharedEntryFromMySide(Long fileId, String userEmail) {
        return fileSharingService.removeSharedEntryFromMySide(fileId, userEmail);
    }

    // ----------------------------------------------------------------------
    // Admin file actions
    // ----------------------------------------------------------------------

    public String adminDeleteFile(Long fileId) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        auditLogService.logAction(
                "FILE_DELETED",
                "ADMIN",
                "Deleted file " + file.getFileName() + " owned by " + file.getOwner().getEmail()
        );

        file.setDeleted(true);
        fileRepository.save(file);

        return "File deleted successfully by admin";
    }

    public String restoreFile(Long fileId) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        file.setDeleted(false);
        fileRepository.save(file);

        auditLogService.logAction(
                "FILE_RESTORED",
                "ADMIN",
                "Restored file " + file.getFileName() + " owned by " + file.getOwner().getEmail()
        );

        return "File restored successfully";
    }

    // ----------------------------------------------------------------------
    // Owner file actions
    // ----------------------------------------------------------------------

    public String deleteFile(Long fileId, Long userId) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        if (!file.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to delete this file");
        }

        file.setDeleted(true);
        fileRepository.save(file);

        return "File deleted successfully";
    }

    // ----------------------------------------------------------------------
    // Recycle bin (owner-scoped)
    // ----------------------------------------------------------------------

    public List<FileListResponse> getDeletedFiles(Long ownerId) {

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        return fileRepository.findByOwnerAndDeletedTrue(owner)
                .stream()
                .map(this::mapToFileListResponse)
                .toList();
    }

    public String restoreOwnedFile(Long fileId, Long ownerId) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to restore this file");
        }

        if (!Boolean.TRUE.equals(file.getDeleted())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File is not in the recycle bin");
        }

        file.setDeleted(false);
        fileRepository.save(file);

        auditLogService.logAction(
                "FILE_RESTORED",
                owner.getEmail(),
                "Restored file " + file.getFileName() + " from the recycle bin"
        );

        return "File restored successfully";
    }

    @Transactional
    public String permanentlyDeleteFile(Long fileId, Long ownerId) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not allowed to delete this file");
        }

        if (!Boolean.TRUE.equals(file.getDeleted())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only files in the recycle bin can be permanently deleted");
        }

        // Drop any shares pointing at this file first, or the file_permissions
        // FK would block the row delete.
        filePermissionRepository.deleteAllByFile(file);

        String fileName = file.getFileName();
        fileRepository.delete(file);

        auditLogService.logAction(
                "FILE_PERMANENTLY_DELETED",
                owner.getEmail(),
                "Permanently deleted file " + fileName
        );

        return "File permanently deleted";
    }

    public FileListResponse updateFileVisibility(Long fileId, String visibility, String ownerEmail) {

        if (ownerEmail == null || ownerEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (visibility == null || visibility.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Visibility is required");
        }

        String normalizedVisibility = visibility.trim().toUpperCase();

        if (!normalizedVisibility.equals("PUBLIC") && !normalizedVisibility.equals("PRIVATE")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Visibility must be PUBLIC or PRIVATE");
        }

        User owner = userRepository.findByEmail(ownerEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated owner user not found"));

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        if (!file.getOwner().getId().equals(owner.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the file owner can change visibility");
        }

        file.setVisibility(normalizedVisibility);

        FileEntity savedFile = fileRepository.save(file);

        return mapToFileListResponse(savedFile);
    }

    public void updateFileContent(Long fileId, String userEmail, String content) {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResourceNotFoundException("File not found"));

        User owner = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        boolean isOwner = file.getOwner().getId().equals(owner.getId());

        boolean isEditor = filePermissionRepository
                .findByFileAndSharedWithUser(file, owner)
                .map(permission -> "EDITOR".equalsIgnoreCase(permission.getPermissionType().getCode()))
                .orElse(false);

        if (!isOwner && !isEditor) {
            throw new ForbiddenException("Only Owner or Editor can edit this file");
        }

        String type = file.getFileType() == null ? "" : file.getFileType().toLowerCase();

        if (!type.equals("txt") && !type.equals("md")) {
            throw new BadRequestException("Only text files (.txt, .md) can be edited");
        }

        if (content == null || content.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File content cannot be empty");
        }

        if (fileValidationService.containsSuspiciousContent(content)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Suspicious file content detected");
        }

        byte[] updatedData = content.getBytes(StandardCharsets.UTF_8);

        Path tempInputPath = null;
        File compressedFile = null;
        CompressionResult compressionResult;

        try {

            tempInputPath = Files.createTempFile("sfms-edit-", "." + type);

            Files.write(tempInputPath, updatedData);

            compressionResult = fileCompressionService.compress(tempInputPath.toFile(), type);

            compressedFile = compressionResult.getCompressedFile();

            file.setFileData(Files.readAllBytes(compressedFile.toPath()));
            file.setFileSize((long) updatedData.length);
            file.setOriginalFileSize(compressionResult.getOriginalSize());
            file.setCompressedFileSize(compressionResult.getCompressedSize());
            file.setCompressed(
                    compressionResult.getCompressedSize() < compressionResult.getOriginalSize());
            file.setCompressionAlgorithm(compressionResult.getAlgorithm());
            file.setRequiresDecompression(compressionResult.isRequiresDecompression());

        } catch (IOException e) {
            throw new RuntimeException("Unable to update file content", e);
        } finally {
            try {
                if (tempInputPath != null) {
                    Files.deleteIfExists(tempInputPath);
                }
            } catch (IOException ignored) {
            }
        }


        fileRepository.save(file);
    }

    public void renameFile(Long fileId, String userEmail, String newFileName) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (newFileName == null || newFileName.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New file name is required");
        }

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean isOwner = file.getOwner().getId().equals(user.getId());

        boolean isEditor = filePermissionRepository
                .findByFileAndSharedWithUser(file, user)
                .map(permission -> "EDITOR".equalsIgnoreCase(permission.getPermissionType().getCode()))
                .orElse(false);

        if (!isOwner && !isEditor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Owner or Editor can rename this file");
        }

        String oldName = file.getFileName();
        String newName = newFileName.trim();

        // Preserve the file's current extension instead of forcing .txt.
        String ext = fileValidationService.getFileExtension(oldName);

        if (!newName.toLowerCase().endsWith("." + ext)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name must keep ." + ext + " extension");
        }

        if (newName.length() > 255) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File name is too long");
        }

        if (!newName.matches("^[a-zA-Z0-9._ -]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file name");
        }

        file.setFileName(newName);
        fileRepository.save(file);

        auditLogService.logAction(
                "FILE_RENAMED",
                user.getEmail(),
                "Renamed file from " + oldName + " to " + newFileName
        );
    }

    public void updateFileDescription(Long fileId, String userEmail, String description) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        boolean isOwner = file.getOwner().getId().equals(user.getId());

        boolean isEditor = filePermissionRepository
                .findByFileAndSharedWithUser(file, user)
                .map(permission -> "EDITOR".equalsIgnoreCase(permission.getPermissionType().getCode()))
                .orElse(false);

        if (!isOwner && !isEditor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Owner or Editor can update description");
        }

        file.setDescription(fileValidationService.cleanDescription(description));
        fileRepository.save(file);

        auditLogService.logAction(
                "FILE_DESCRIPTION_UPDATED",
                user.getEmail(),
                "Updated description for file: " + file.getFileName()
        );
    }
}