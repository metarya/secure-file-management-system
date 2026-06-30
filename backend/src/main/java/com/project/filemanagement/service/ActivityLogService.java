package com.project.filemanagement.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.project.filemanagement.dto.ActivityChangesResponse;
import com.project.filemanagement.dto.ActivityLogDetailResponse;
import com.project.filemanagement.dto.ActivityLogResponse;
import com.project.filemanagement.dto.PageResponse;
import com.project.filemanagement.entity.ActivityLog;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.exception.ResourceNotFoundException;
import com.project.filemanagement.repository.ActivityLogRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.repository.UserRoleRepository;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;

/**
 * Reusable, system-wide activity logging service.
 *
 * <p>This is the single entry point every layer uses to record an important
 * action. Logging is intentionally <em>best-effort</em>: a failure to write an
 * activity record must never break (or roll back) the business operation that
 * triggered it, so {@link #save} swallows and logs any persistence error.
 *
 * <p>Prefer calling this from the service layer (where the acting {@link User}
 * and affected resource are already loaded) over the controller layer.
 */
@Slf4j
@Service
public class ActivityLogService {

    // --- Status constants ---------------------------------------------------
    public static final String SUCCESS = "SUCCESS";
    public static final String FAILURE = "FAILURE";

    // --- Resource-type constants -------------------------------------------
    public static final String RESOURCE_AUTH = "AUTH";
    public static final String RESOURCE_FILE = "FILE";
    public static final String RESOURCE_SHARE = "SHARE";
    public static final String RESOURCE_USER = "USER";

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    public ActivityLogService(
            ActivityLogRepository activityLogRepository,
            UserRepository userRepository,
            UserRoleRepository userRoleRepository
    ) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
    }

    // ----------------------------------------------------------------------
    // Write API
    // ----------------------------------------------------------------------

    /**
     * Primary logging entry point (matches the documented contract). The
     * actor's display name and role are resolved from the {@link User}.
     *
     * @param user          the user who performed the action (may be {@code null})
     * @param action        machine-readable action key, e.g. {@code FILE_UPLOAD}
     * @param resourceType  e.g. {@code FILE}, {@code USER}, {@code SHARE}, {@code AUTH}
     * @param resourceId    affected resource id (nullable)
     * @param resourceName  affected resource name (nullable)
     * @param status        {@link #SUCCESS} or {@link #FAILURE}
     * @param versionBefore reference to the file version before an edit (nullable)
     * @param versionAfter  reference to the file version after an edit (nullable)
     * @param details       free-form human-readable description (nullable)
     */
    public void log(
            User user,
            String action,
            String resourceType,
            Long resourceId,
            String resourceName,
            String status,
            String versionBefore,
            String versionAfter,
            String details
    ) {
        log(user, action, resourceType, resourceId, resourceName, status,
                versionBefore, versionAfter, null, null, details);
    }

    /**
     * Extended overload that additionally records the FileVersion ids on either
     * side of an edit ({@code versionBeforeId} / {@code versionAfterId}). These
     * power the Phase-2 diff viewer, which compares the two versions — the
     * activity log stores references, never file contents.
     */
    public void log(
            User user,
            String action,
            String resourceType,
            Long resourceId,
            String resourceName,
            String status,
            String versionBefore,
            String versionAfter,
            Long versionBeforeId,
            Long versionAfterId,
            String details
    ) {
        String email = user == null ? null : user.getEmail();
        String name = user == null ? null : user.getFullName();
        String role = user == null ? null : resolveRole(user);

        write(email, name, role, action, resourceType, resourceId,
                resourceName, status, versionBefore, versionAfter,
                versionBeforeId, versionAfterId, details);
    }

    /**
     * Logging entry point for places that only hold an email (e.g. failed
     * logins for an unknown account, or edits performed by email). The user is
     * looked up best-effort to enrich name/role; if not found the email is used
     * as the display name and the role is left blank.
     */
    public void logByEmail(
            String actorEmail,
            String action,
            String resourceType,
            Long resourceId,
            String resourceName,
            String status,
            String versionBefore,
            String versionAfter,
            String details
    ) {
        String name = actorEmail;
        String role = null;

        try {
            User user = actorEmail == null ? null
                    : userRepository.findByEmail(actorEmail).orElse(null);
            if (user != null) {
                name = user.getFullName();
                role = resolveRole(user);
            }
        } catch (Exception ignored) {
            // Enrichment is best-effort; fall back to the raw email.
        }

        write(actorEmail, name, role, action, resourceType, resourceId,
                resourceName, status, versionBefore, versionAfter, null, null, details);
    }

    /** Convenience overload for simple, non-resource, non-versioned events. */
    public void log(
            User user,
            String action,
            String resourceType,
            String status,
            String details
    ) {
        log(user, action, resourceType, null, null, status, null, null, details);
    }

    private void write(
            String actorEmail,
            String actorName,
            String actorRole,
            String action,
            String resourceType,
            Long resourceId,
            String resourceName,
            String status,
            String versionBefore,
            String versionAfter,
            Long versionBeforeId,
            Long versionAfterId,
            String details
    ) {
        try {
            ActivityLog entry = ActivityLog.builder()
                    .actorEmail(actorEmail)
                    .actorName(actorName)
                    .actorRole(actorRole)
                    .action(action)
                    .resourceType(resourceType)
                    .resourceId(resourceId)
                    .resourceName(truncate(resourceName, 500))
                    .status(status == null ? SUCCESS : status)
                    .versionBefore(truncate(versionBefore, 255))
                    .versionAfter(truncate(versionAfter, 255))
                    .versionBeforeId(versionBeforeId)
                    .versionAfterId(versionAfterId)
                    .details(truncate(details, 2000))
                    .createdAt(LocalDateTime.now())
                    .build();

            activityLogRepository.save(entry);
        } catch (Exception e) {
            // Never let an audit failure break the underlying operation.
            log.warn("Failed to persist activity log for action {}: {}", action, e.getMessage());
        }
    }

    private String resolveRole(User user) {
        try {
            return userRoleRepository.findByUser(user)
                    .stream()
                    .findFirst()
                    .map(userRole -> userRole.getRole().getName())
                    .orElse("NO_ROLE");
        } catch (Exception e) {
            return null;
        }
    }

    private static String truncate(String value, int max) {
        if (value == null) {
            return null;
        }
        return value.length() <= max ? value : value.substring(0, max);
    }

    // ----------------------------------------------------------------------
    // Read API
    // ----------------------------------------------------------------------

    /** One page of activity records, optionally filtered by a search term. */
    public PageResponse<ActivityLogResponse> getLogsPage(String search, Pageable pageable) {

        boolean hasSearch = search != null && !search.isBlank();
        String term = hasSearch ? search.trim() : null;

        Page<ActivityLog> page = hasSearch
                ? activityLogRepository
                    .findByActorNameContainingIgnoreCaseOrActorEmailContainingIgnoreCaseOrActionContainingIgnoreCaseOrResourceNameContainingIgnoreCaseOrStatusContainingIgnoreCaseOrDetailsContainingIgnoreCase(
                            term, term, term, term, term, term, pageable)
                : activityLogRepository.findAll(pageable);

        return PageResponse.of(page, ActivityLogResponse::from);
    }

    public ActivityLogDetailResponse getDetail(Long id) {
        ActivityLog log = activityLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity record not found"));
        return ActivityLogDetailResponse.from(log);
    }

    /**
     * "View Changes" for an edit activity. Phase 1 returns the recorded version
     * references and a status message; the rendered diff is generated in a later
     * phase once file version contents are retained.
     */
    public ActivityChangesResponse getChanges(Long id) {
        ActivityLog log = activityLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Activity record not found"));

        boolean hasVersions = log.getVersionBefore() != null || log.getVersionAfter() != null
                || log.getVersionBeforeId() != null || log.getVersionAfterId() != null;

        if (!hasVersions) {
            return new ActivityChangesResponse(
                    log.getId(),
                    "UNAVAILABLE",
                    log.getResourceName(),
                    null,
                    null,
                    null,
                    null,
                    "No version information was recorded for this event."
            );
        }

        // File versions are now retained: expose the version references and ids so
        // the Phase-2 viewer can fetch both versions and render a diff. Diff
        // generation itself is intentionally not done in this phase.
        return new ActivityChangesResponse(
                log.getId(),
                "TEXT_DIFF_PENDING",
                log.getResourceName(),
                log.getVersionBefore(),
                log.getVersionAfter(),
                log.getVersionBeforeId(),
                log.getVersionAfterId(),
                "Version references recorded (versionBeforeId -> versionAfterId). "
                        + "Diff rendering will be added in the next phase."
        );
    }
}
