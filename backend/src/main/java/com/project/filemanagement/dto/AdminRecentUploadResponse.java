package com.project.filemanagement.dto;

import java.time.LocalDateTime;

public class AdminRecentUploadResponse {

    private final Long fileId;
    private final String fileName;
    private final String ownerName;
    private final String ownerEmail;
    private final LocalDateTime uploadedAt;

    public AdminRecentUploadResponse(
            Long fileId,
            String fileName,
            String ownerName,
            String ownerEmail,
            LocalDateTime uploadedAt
    ) {
        this.fileId = fileId;
        this.fileName = fileName;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
        this.uploadedAt = uploadedAt;
    }

    public Long getFileId() {
        return fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }
}