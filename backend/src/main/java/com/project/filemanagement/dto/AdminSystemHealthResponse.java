package com.project.filemanagement.dto;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor

public class AdminSystemHealthResponse {

    private final long totalUsers;
    private final long activeUsers;
    private final long blockedUsers;
    private final long totalFiles;
    private final long totalStorageBytes;
}