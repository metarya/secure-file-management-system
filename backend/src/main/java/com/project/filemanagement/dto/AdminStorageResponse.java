package com.project.filemanagement.dto;

public class AdminStorageResponse {

    private final Long userId;
    private final String fullName;
    private final String email;
    private final long totalFiles;
    private final long totalStorageBytes;

    public AdminStorageResponse(
            Long userId,
            String fullName,
            String email,
            long totalFiles,
            long totalStorageBytes
    ) {
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.totalFiles = totalFiles;
        this.totalStorageBytes = totalStorageBytes;
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

    public long getTotalStorageBytes() {
        return totalStorageBytes;
    }
}