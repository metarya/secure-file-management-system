package com.project.filemanagement.dto;

public class AdminUserFileSummaryResponse {

    private Long userId;
    private String fullName;
    private String email;
    private long totalFiles;
    private long totalStorageBytes;

    public AdminUserFileSummaryResponse(
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