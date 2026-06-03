package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AdminUserFileSummaryResponse {

    private final Long userId;
    private final String fullName;
    private final String email;
    private final long totalFiles;
    private final long totalStorageBytes;
}