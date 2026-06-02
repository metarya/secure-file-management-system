package com.project.filemanagement.dto;

import java.time.LocalDateTime;

public class AdminUserActivityResponse {

    private final Long userId;
    private final String fullName;
    private final String email;
    private final long totalFiles;
    private final long storageUsedBytes;
    private final LocalDateTime lastUploadDate;

    public AdminUserActivityResponse(
            Long userId,
            String fullName,
            String email,
            long totalFiles,
            long storageUsedBytes,
            LocalDateTime lastUploadDate
    ) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.totalFiles = totalFiles;
        this.storageUsedBytes = storageUsedBytes;
        this.lastUploadDate = lastUploadDate;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public long getTotalFiles() {
        return totalFiles;
    }

    public long getStorageUsedBytes() {
        return storageUsedBytes;
    }

    public LocalDateTime getLastUploadDate() {
        return lastUploadDate;
    }
}