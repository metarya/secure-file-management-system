package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor

public class AuditLogResponse {

    private final Long id;
    private final String action;
    private final String performedBy;
    private final String details;
    private final LocalDateTime createdAt;
}