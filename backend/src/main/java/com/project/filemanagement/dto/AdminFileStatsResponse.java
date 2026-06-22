package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;


@Getter
@RequiredArgsConstructor

public class AdminFileStatsResponse {

    private final long totalFiles;
    private final long publicFiles;
    private final long privateFiles;
    private final long totalStorageBytes;
    private final double totalStorageMB;
}