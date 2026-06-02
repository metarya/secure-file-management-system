package com.project.filemanagement.dto;

public class AdminSystemHealthResponse {

    private final long totalUsers;
    private final long activeUsers;
    private final long blockedUsers;
    private final long totalFiles;
    private final long totalStorageBytes;

    public AdminSystemHealthResponse(
            long totalUsers,
            long activeUsers,
            long blockedUsers,
            long totalFiles,
            long totalStorageBytes
    ) {
        this.totalUsers = totalUsers;
        this.activeUsers = activeUsers;
        this.blockedUsers = blockedUsers;
        this.totalFiles = totalFiles;
        this.totalStorageBytes = totalStorageBytes;
    }

    public long getTotalUsers() {
        return totalUsers;
    }

    public long getActiveUsers() {
        return activeUsers;
    }

    public long getBlockedUsers() {
        return blockedUsers;
    }

    public long getTotalFiles() {
        return totalFiles;
    }

    public long getTotalStorageBytes() {
        return totalStorageBytes;
    }
}