package com.project.filemanagement.service;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.dto.FileListResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.exception.BadRequestException;
import com.project.filemanagement.exception.ForbiddenException;
import com.project.filemanagement.exception.ResourceNotFoundException;
import com.project.filemanagement.repository.FilePermissionRepository;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.service.compression.CompressionResult;
import com.project.filemanagement.storage.StorageContext;
import com.project.filemanagement.storage.StorageProviderRegistry;
import com.project.filemanagement.storage.StorageProviderType;

/**
 * Handles in-place mutations to existing file attributes:
 * rename, description update, visibility change, and text-content edit.
 */
@Service
public class FileMetadataService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FilePermissionRepository filePermissionRepository;
    private final FileValidationService fileValidationService;
    private final FileCompressionService fileCompressionService;
    private final FileHashService fileHashService;
    private final FileVersionService fileVersionService;
    private final AuditLogService auditLogService;
    private final ActivityLogService activityLogService;
    private final UserStorageSettingsService storageSettingsService;
    private final StorageProviderRegistry storageRegistry;

    public FileMetadataService(
            FileRepository fileRepository,
            UserRepository userRepository,
            FilePermissionRepository filePermissionRepository,
            FileValidationService fileValidationService,
            FileCompressionService fileCompressionService,
            FileHashService fileHashService,
            FileVersionService fileVersionService,
            AuditLogService auditLogService,
            ActivityLogService activityLogService,
            UserStorageSettingsService storageSettingsService,
            StorageProviderRegistry storageRegistry
    ) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.filePermissionRepository = filePermissionRepository;
        this.fileValidationService = fileValidationService;
        this.fileCompressionService = fileCompressionService;
        this.fileHashService = fileHashService;
        this.fileVersionService = fileVersionService;
        this.auditLogService = auditLogService;
        this.activityLogService = activityLogService;
        this.storageSettingsService = storageSettingsService;
        this.storageRegistry = storageRegistry;
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
                .map(p -> "EDITOR".equalsIgnoreCase(p.getPermissionType().getCode()))
                .orElse(false);

        if (!isOwner && !isEditor) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only Owner or Editor can rename this file");
        }

        String oldName = file.getFileName();
        String newName = newFileName.trim();
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

        activityLogService.log(
                user,
                "FILE_EDIT",
                ActivityLogService.RESOURCE_FILE,
                file.getId(),
                newName,
                ActivityLogService.SUCCESS,
                null,
                null,
                "Renamed file from " + oldName + " to " + newName);
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
                .map(p -> "EDITOR".equalsIgnoreCase(p.getPermissionType().getCode()))
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

        activityLogService.log(
                user,
                "FILE_EDIT",
                ActivityLogService.RESOURCE_FILE,
                file.getId(),
                file.getFileName(),
                ActivityLogService.SUCCESS,
                null,
                null,
                "Updated description for file: " + file.getFileName());
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
                .map(p -> "EDITOR".equalsIgnoreCase(p.getPermissionType().getCode()))
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
        String beforeRef = FileUploadService.versionRef(file.getFileHash(), file.getFileSize());
        String newHash = fileHashService.generateSha256Hash(updatedData);

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
            file.setFileHash(newHash);
            file.setOriginalFileSize(compressionResult.getOriginalSize());
            file.setCompressedFileSize(compressionResult.getCompressedSize());
            file.setCompressed(compressionResult.getCompressedSize() < compressionResult.getOriginalSize());
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

        StorageProviderType editProvider = StorageProviderType.fromString(file.getStorageProvider());
        if (editProvider != StorageProviderType.LOCAL) {
            StorageContext ctx = storageSettingsService.contextFor(owner, editProvider);
            String key = storageRegistry.get(editProvider)
                    .upload(ctx, file.getFileName(), updatedData, file.getContentType());
            file.setStorageKey(key);
            file.setFileData(null);
        }

        fileRepository.save(file);

        FileVersionService.VersionTransition transition = fileVersionService.recordNewVersion(
                file,
                updatedData,
                newHash,
                file.getContentType(),
                owner.getEmail(),
                "Edited content");

        activityLogService.log(
                owner,
                "FILE_EDIT",
                ActivityLogService.RESOURCE_FILE,
                file.getId(),
                file.getFileName(),
                ActivityLogService.SUCCESS,
                beforeRef,
                FileUploadService.versionRef(newHash, (long) updatedData.length),
                transition.previousVersionId(),
                transition.newVersion().getId(),
                "Edited content of file " + file.getFileName());
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
}
