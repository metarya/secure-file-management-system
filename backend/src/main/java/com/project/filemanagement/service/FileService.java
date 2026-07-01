package com.project.filemanagement.service;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.dto.AdminFilePreviewResponse;
import com.project.filemanagement.dto.FileListResponse;
import com.project.filemanagement.dto.FileVersionResponse;
import com.project.filemanagement.dto.PageResponse;
import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.dto.ShareFileRequest;
import com.project.filemanagement.dto.ShareFileResponse;
import com.project.filemanagement.dto.SharedWithMeFileResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.exception.ResourceNotFoundException;
import com.project.filemanagement.repository.FilePermissionRepository;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.service.streaming.HlsService;
import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageProviderRegistry;
import com.project.filemanagement.storage.StorageProviderType;

/**
 * Facade for file operations: delegates upload to {@link FileUploadService},
 * metadata mutations to {@link FileMetadataService}, and content/sharing/versioning
 * to their respective dedicated services. Retains listing, delete/restore, and
 * the streaming/preview/sharing pass-through layer.
 */
@Service
public class FileService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FilePermissionRepository filePermissionRepository;
    private final AuditLogService auditLogService;
    private final ActivityLogService activityLogService;
    private final FileContentService fileContentService;
    private final FileVersionService fileVersionService;
    private final FileSharingService fileSharingService;
    private final FileStreamingService fileStreamingService;
    private final MarkdownService markdownService;
    private final HlsService hlsService;
    private final UserStorageSettingsService storageSettingsService;
    private final StorageProviderRegistry storageRegistry;
    private final FileUploadService fileUploadService;
    private final FileMetadataService fileMetadataService;

    public FileService(
            FileRepository fileRepository,
            UserRepository userRepository,
            FilePermissionRepository filePermissionRepository,
            AuditLogService auditLogService,
            ActivityLogService activityLogService,
            FileContentService fileContentService,
            FileVersionService fileVersionService,
            FileSharingService fileSharingService,
            FileStreamingService fileStreamingService,
            MarkdownService markdownService,
            HlsService hlsService,
            UserStorageSettingsService storageSettingsService,
            StorageProviderRegistry storageRegistry,
            FileUploadService fileUploadService,
            FileMetadataService fileMetadataService
    ) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.filePermissionRepository = filePermissionRepository;
        this.auditLogService = auditLogService;
        this.activityLogService = activityLogService;
        this.fileContentService = fileContentService;
        this.fileVersionService = fileVersionService;
        this.fileSharingService = fileSharingService;
        this.fileStreamingService = fileStreamingService;
        this.markdownService = markdownService;
        this.hlsService = hlsService;
        this.storageSettingsService = storageSettingsService;
        this.storageRegistry = storageRegistry;
        this.fileUploadService = fileUploadService;
        this.fileMetadataService = fileMetadataService;
    }

    // ----------------------------------------------------------------------
    // Upload (delegated to FileUploadService)
    // ----------------------------------------------------------------------

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId) {
        return fileUploadService.uploadFile(file, ownerId);
    }

    public FileUploadResponse uploadFile(MultipartFile file, Long ownerId, String description) {
        return fileUploadService.uploadFile(file, ownerId, description);
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

    public PageResponse<FileListResponse> getMyFilesPage(Long ownerId, String search, Pageable pageable) {

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        boolean hasSearch = search != null && !search.isBlank();

        var page = hasSearch
                ? fileRepository.findByOwnerAndDeletedFalseAndFileNameContainingIgnoreCase(
                        owner, search.trim(), pageable)
                : fileRepository.findByOwnerAndDeletedFalse(owner, pageable);

        return PageResponse.of(page, this::mapToFileListResponse);
    }

    public PageResponse<FileListResponse> getDeletedFilesPage(Long ownerId, Pageable pageable) {

        if (ownerId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner ID is required");
        }

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Owner user not found"));

        return PageResponse.of(
                fileRepository.findByOwnerAndDeletedTrue(owner, pageable),
                this::mapToFileListResponse);
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
        ResponseEntity<byte[]> result = fileContentService.serveFileContent(fileId, userEmail, false);
        logFileAccess(fileId, userEmail, "FILE_PREVIEW", "Previewed file");
        return result;
    }

    public ResponseEntity<byte[]> downloadFile(Long fileId, String userEmail) {
        ResponseEntity<byte[]> result = fileContentService.serveFileContent(fileId, userEmail, true);
        logFileAccess(fileId, userEmail, "FILE_DOWNLOAD", "Downloaded file");
        return result;
    }

    public ResponseEntity<byte[]> streamFile(Long fileId, String userEmail, String rangeHeader) {
        return fileStreamingService.streamFile(fileId, userEmail, rangeHeader);
    }

    public String renderMarkdownPreview(Long fileId, String userEmail) {

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        String type = file.getFileType() == null ? "" : file.getFileType().toLowerCase();

        if (!type.equals("md") && !type.equals("txt")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Markdown preview is only available for .md and .txt files");
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
    // Versioning (delegated to FileVersionService)
    // ----------------------------------------------------------------------

    public List<FileVersionResponse> getFileVersions(Long fileId, String userEmail) {
        return fileVersionService.getVersions(fileId, userEmail);
    }

    public FileVersionResponse getFileVersion(Long fileId, Long versionId, String userEmail) {
        return fileVersionService.getVersion(fileId, versionId, userEmail);
    }

    // ----------------------------------------------------------------------
    // Sharing (delegated to FileSharingService)
    // ----------------------------------------------------------------------

    public ShareFileResponse shareFile(ShareFileRequest request, String ownerEmail) {
        return fileSharingService.shareFile(request, ownerEmail);
    }

    public List<SharedWithMeFileResponse> getSharedWithMeFiles(String userEmail) {
        return fileSharingService.getSharedWithMeFiles(userEmail);
    }

    public PageResponse<SharedWithMeFileResponse> getSharedWithMeFilesPage(String userEmail, Pageable pageable) {
        return fileSharingService.getSharedWithMeFilesPage(userEmail, pageable);
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
    // Metadata mutations (delegated to FileMetadataService)
    // ----------------------------------------------------------------------

    public FileListResponse updateFileVisibility(Long fileId, String visibility, String ownerEmail) {
        return fileMetadataService.updateFileVisibility(fileId, visibility, ownerEmail);
    }

    public void updateFileContent(Long fileId, String userEmail, String content) {
        fileMetadataService.updateFileContent(fileId, userEmail, content);
    }

    public void renameFile(Long fileId, String userEmail, String newFileName) {
        fileMetadataService.renameFile(fileId, userEmail, newFileName);
    }

    public void updateFileDescription(Long fileId, String userEmail, String description) {
        fileMetadataService.updateFileDescription(fileId, userEmail, description);
    }

    // ----------------------------------------------------------------------
    // Admin file actions
    // ----------------------------------------------------------------------

    public String adminDeleteFile(Long fileId) {
        return adminDeleteFile(fileId, null);
    }

    public String adminDeleteFile(Long fileId, String actingAdminEmail) {

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

        activityLogService.logByEmail(
                actingAdminEmail,
                "FILE_DELETE",
                ActivityLogService.RESOURCE_FILE,
                file.getId(),
                file.getFileName(),
                ActivityLogService.SUCCESS,
                null,
                null,
                "Admin deleted file " + file.getFileName()
                        + " owned by " + file.getOwner().getEmail());

        file.setDeleted(true);
        fileRepository.save(file);

        return "File deleted successfully by admin";
    }

    public String restoreFile(Long fileId) {
        return restoreFile(fileId, null);
    }

    public String restoreFile(Long fileId, String actingAdminEmail) {

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

        activityLogService.logByEmail(
                actingAdminEmail,
                "FILE_RESTORE",
                ActivityLogService.RESOURCE_FILE,
                file.getId(),
                file.getFileName(),
                ActivityLogService.SUCCESS,
                null,
                null,
                "Admin restored file " + file.getFileName()
                        + " owned by " + file.getOwner().getEmail());

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

        activityLogService.log(
                user,
                "FILE_DELETE",
                ActivityLogService.RESOURCE_FILE,
                file.getId(),
                file.getFileName(),
                ActivityLogService.SUCCESS,
                null,
                null,
                "Moved file to recycle bin: " + file.getFileName());

        return "File deleted successfully";
    }

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

        activityLogService.log(
                owner,
                "FILE_RESTORE",
                ActivityLogService.RESOURCE_FILE,
                file.getId(),
                file.getFileName(),
                ActivityLogService.SUCCESS,
                null,
                null,
                "Restored file " + file.getFileName() + " from the recycle bin");

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

        filePermissionRepository.deleteAllByFile(file);

        StorageProviderType delProvider = StorageProviderType.fromString(file.getStorageProvider());
        if (delProvider != StorageProviderType.LOCAL && file.getStorageKey() != null) {
            try {
                StorageContext ctx = storageSettingsService.contextFor(owner, delProvider);
                storageRegistry.get(delProvider).delete(ctx, file.getStorageKey());
            } catch (Exception ignored) {
            }
        }

        String fileName = file.getFileName();
        fileRepository.delete(file);

        auditLogService.logAction(
                "FILE_PERMANENTLY_DELETED",
                owner.getEmail(),
                "Permanently deleted file " + fileName
        );

        activityLogService.log(
                owner,
                "FILE_PERMANENT_DELETE",
                ActivityLogService.RESOURCE_FILE,
                fileId,
                fileName,
                ActivityLogService.SUCCESS,
                null,
                null,
                "Permanently deleted file " + fileName);

        return "File permanently deleted";
    }

    // ----------------------------------------------------------------------
    // Activity-log helpers
    // ----------------------------------------------------------------------

    private void logFileAccess(Long fileId, String userEmail, String action, String description) {
        try {
            FileEntity file = fileRepository.findById(fileId).orElse(null);
            String name = file == null ? null : file.getFileName();
            activityLogService.logByEmail(
                    userEmail,
                    action,
                    ActivityLogService.RESOURCE_FILE,
                    fileId,
                    name,
                    ActivityLogService.SUCCESS,
                    null,
                    null,
                    description + (name == null ? "" : (": " + name)));
        } catch (Exception ignored) {
        }
    }
}
