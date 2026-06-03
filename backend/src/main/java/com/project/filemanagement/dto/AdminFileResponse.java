package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.RequiredArgsConstructor;


@Getter
@RequiredArgsConstructor
public class AdminFileResponse {

    private final Long fileId;
    private final String fileName;
    private final String description;
    private final Long fileSize;
    private final String visibility;
    private final LocalDateTime uploadedAt;

    private final Long ownerId;
    private final String ownerName;
    private final String ownerEmail;
}