package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class FileListResponse {

    private final Long fileId;
    private final String fileName;
    private final String description;
    private final String fileType;
    private final Long fileSize;
    private final Long originalFileSize;
    private final Long compressedFileSize;
    private final Boolean compressed;
    private final String visibility;
    private final LocalDateTime uploadedAt;
}