package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import com.project.filemanagement.entity.ActivityLog;

/**
 * Compact row used by the System Activity Log table.
 * Columns: Timestamp, User, Action, Resource, Status.
 */
public record ActivityLogResponse(
        Long id,
        LocalDateTime timestamp,
        String actorName,
        String actorEmail,
        String action,
        String resourceType,
        String resourceName,
        String status,
        boolean hasVersions
) {
    public static ActivityLogResponse from(ActivityLog log) {
        return new ActivityLogResponse(
                log.getId(),
                log.getCreatedAt(),
                log.getActorName(),
                log.getActorEmail(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceName(),
                log.getStatus(),
                log.getVersionBefore() != null || log.getVersionAfter() != null
        );
    }
}
