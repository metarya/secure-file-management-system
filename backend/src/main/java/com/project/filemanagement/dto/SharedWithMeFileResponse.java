package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class SharedWithMeFileResponse {

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

    private final Long ownerId;
    private final String ownerName;
    private final String ownerEmail;

    private final Long permissionId;
    private final String permissionType;
    private final LocalDateTime sharedAt;
}