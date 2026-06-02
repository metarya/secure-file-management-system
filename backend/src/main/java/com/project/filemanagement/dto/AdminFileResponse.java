package com.project.filemanagement.dto;

import java.time.LocalDateTime;

public class AdminFileResponse {

    private Long fileId;
    private String fileName;
    private String description;
    private Long fileSize;
    private String visibility;
    private LocalDateTime uploadedAt;

    private Long ownerId;
    private String ownerName;
    private String ownerEmail;

    public AdminFileResponse() {
    }

    public AdminFileResponse(
            Long fileId,
            String fileName,
            String description,
            Long fileSize,
            String visibility,
            LocalDateTime uploadedAt,
            Long ownerId,
            String ownerName,
            String ownerEmail
    ) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.description = description;
        this.fileSize = fileSize;
        this.visibility = visibility;
        this.uploadedAt = uploadedAt;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
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

    public Long getFileSize() {
        return fileSize;
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
}