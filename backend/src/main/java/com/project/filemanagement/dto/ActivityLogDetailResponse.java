package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import com.project.filemanagement.entity.ActivityLog;

/**
 * Full detail shown when an administrator opens a single activity record.
 */
public record ActivityLogDetailResponse(
        Long id,
        String actorName,
        String actorEmail,
        String actorRole,
        LocalDateTime timestamp,
        String action,
        String resourceType,
        String resourceName,
        Long resourceId,
        String status,
        String details,
        String versionBefore,
        String versionAfter,
        Long versionBeforeId,
        Long versionAfterId,
        boolean hasVersions
) {
    public static ActivityLogDetailResponse from(ActivityLog log) {
        return new ActivityLogDetailResponse(
                log.getId(),
                log.getActorName(),
                log.getActorEmail(),
                log.getActorRole(),
                log.getCreatedAt(),
                log.getAction(),
                log.getResourceType(),
                log.getResourceName(),
                log.getResourceId(),
                log.getStatus(),
                log.getDetails(),
                log.getVersionBefore(),
                log.getVersionAfter(),
                log.getVersionBeforeId(),
                log.getVersionAfterId(),
                log.getVersionBefore() != null || log.getVersionAfter() != null
                        || log.getVersionBeforeId() != null || log.getVersionAfterId() != null
        );
    }
}
