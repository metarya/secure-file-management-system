package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.RequiredArgsConstructor;


@Getter
@RequiredArgsConstructor

public class AdminRecentUploadResponse {

    private final Long fileId;
    private final String fileName;
    private final String ownerName;
    private final String ownerEmail;
    private final LocalDateTime uploadedAt;
}