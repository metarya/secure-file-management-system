package com.project.filemanagement.dto;

import java.time.LocalDateTime;

public class SharedWithMeFileResponse {

    private Long fileId;
    private String fileName;
    private String description;
    private String fileType;
    private Long fileSize;
    private Long originalFileSize;
    private Long compressedFileSize;
    private Boolean compressed;
    private String visibility;
    private LocalDateTime uploadedAt;

    private Long ownerId;
    private String ownerName;
    private String ownerEmail;

    private Long permissionId;
    private String permissionType;
    private LocalDateTime sharedAt;

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
