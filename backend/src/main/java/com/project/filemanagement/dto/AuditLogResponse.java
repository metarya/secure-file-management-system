package com.project.filemanagement.dto;

import java.time.LocalDateTime;

public class AuditLogResponse {

    private final Long id;
    private final String action;
    private final String performedBy;
    private final String details;
    private final LocalDateTime createdAt;

    public AuditLogResponse(
            Long id,
            String action,
            String performedBy,
            String details,
            LocalDateTime createdAt
    ) {
        this.id = id;
        this.action = action;
        this.performedBy = performedBy;
        this.details = details;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getAction() {
        return action;
    }

    public String getPerformedBy() {
        return performedBy;
    }

    public String getDetails() {
        return details;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}