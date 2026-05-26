package com.project.filemanagement.dto;

import java.time.LocalDateTime;

public class SharedWithMeFileResponse {

    private final Long fileId;
    private final String fileName;
    private final String description;
    private final String fileType;
    private final Long fileSize;
    private final Long originalFileSize;
    private final Long compressedFileSize;
    private final Boolean compressed;
    private final String visibility;
    private final LocalDateTime uploadedAt;

    private final Long ownerId;
    private final String ownerName;
    private final String ownerEmail;

    private final Long permissionId;
    private final String permissionType;
    private final LocalDateTime sharedAt;

    public SharedWithMeFileResponse(
            Long fileId,
            String fileName,
            String description,
            String fileType,
            Long fileSize,
            Long originalFileSize,
            Long compressedFileSize,
            Boolean compressed,
            String visibility,
            LocalDateTime uploadedAt,
            Long ownerId,
            String ownerName,
            String ownerEmail,
            Long permissionId,
            String permissionType,
            LocalDateTime sharedAt
    ) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.description = description;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.originalFileSize = originalFileSize;
        this.compressedFileSize = compressedFileSize;
        this.compressed = compressed;
        this.visibility = visibility;
        this.uploadedAt = uploadedAt;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
        this.permissionId = permissionId;
        this.permissionType = permissionType;
        this.sharedAt = sharedAt;
    }

    public Long getFileId() {
        return fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getDescription() {
        return description;
    }

    public String getFileType() {
        return fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public Long getOriginalFileSize() {
        return originalFileSize;
    }

    public Long getCompressedFileSize() {
        return compressedFileSize;
    }

    public Boolean getCompressed() {
        return compressed;
    }

    public String getVisibility() {
        return visibility;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public Long getPermissionId() {
        return permissionId;
    }

    public String getPermissionType() {
        return permissionType;
    }

    public LocalDateTime getSharedAt() {
        return sharedAt;
    }
}