package com.project.filemanagement.dto;

public class AdminFileStatsResponse {

    private long totalFiles;
    private long publicFiles;
    private long privateFiles;
    private long totalStorageBytes;
    private double totalStorageMB;

    public AdminFileStatsResponse(
            long totalFiles,
            long publicFiles,
            long privateFiles,
            long totalStorageBytes,
            double totalStorageMB
    ) {
        this.totalFiles = totalFiles;
        this.publicFiles = publicFiles;
        this.privateFiles = privateFiles;
        this.totalStorageBytes = totalStorageBytes;
        this.totalStorageMB = totalStorageMB;
    }

    public long getTotalFiles() {
        return totalFiles;
    }

    public long getPublicFiles() {
        return publicFiles;
    }

    public long getPrivateFiles() {
        return privateFiles;
    }

    public long getTotalStorageBytes() {
        return totalStorageBytes;
    }

    public double getTotalStorageMB() {
        return totalStorageMB;
    }
}