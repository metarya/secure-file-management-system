package com.project.filemanagement.dto;

import java.time.LocalDateTime;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor

public class AdminUserActivityResponse {

    private final Long userId;
    private final String fullName;
    private final String email;
    private final long totalFiles;
    private final long storageUsedBytes;
    private final LocalDateTime lastUploadDate;

}