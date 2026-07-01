package com.project.filemanagement.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * A single system-activity record — every important action performed by every
 * user in the system (authentication, file operations, sharing, administration).
 *
 * <p>This is the richer successor to {@link AuditLog}: it captures the actor's
 * identity <em>and</em> role, the affected resource (type / id / name), an
 * outcome status, and — for file edits — lightweight references to the file
 * version before and after the change. The full old/new file contents are
 * deliberately <em>not</em> stored here; only {@code versionBefore} /
 * {@code versionAfter} references are kept so a diff can be generated on demand
 * when an administrator requests "View Changes".
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "activity_logs",
        indexes = {
                @Index(name = "idx_activity_created_at", columnList = "created_at"),
                @Index(name = "idx_activity_actor_email", columnList = "actor_email"),
                @Index(name = "idx_activity_action", columnList = "action")
        }
)
public class ActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Email of the user who performed the action (null/attempted-email for failed logins). */
    @Column(name = "actor_email", length = 150)
    private String actorEmail;

    /** Display name of the actor at the time of the action. */
    @Column(name = "actor_name", length = 150)
    private String actorName;

    /** Primary role of the actor at the time of the action (e.g. ADMIN, USER). */
    @Column(name = "actor_role", length = 50)
    private String actorRole;

    /** Machine-readable action key, e.g. LOGIN, FILE_UPLOAD, ROLE_CHANGED. */
    @Column(name = "action", nullable = false, length = 64)
    private String action;

    /** Type of the affected resource, e.g. FILE, USER, SHARE, AUTH. */
    @Column(name = "resource_type", length = 32)
    private String resourceType;

    /** Identifier of the affected resource (file id, user id, …) when applicable. */
    @Column(name = "resource_id")
    private Long resourceId;

    /** Human-readable name of the affected resource (file name, user email, …). */
    @Column(name = "resource_name", length = 500)
    private String resourceName;

    /** Outcome of the action: SUCCESS or FAILURE. */
    @Column(name = "status", nullable = false, length = 16)
    private String status;

    /** Reference to the file version BEFORE an edit (e.g. hash · size). Never the full content. */
    @Column(name = "version_before", length = 255)
    private String versionBefore;

    /** Reference to the file version AFTER an edit (e.g. hash · size). Never the full content. */
    @Column(name = "version_after", length = 255)
    private String versionAfter;

    /** FK-style id of the FileVersion BEFORE an edit (for the Phase-2 diff viewer). */
    @Column(name = "version_before_id")
    private Long versionBeforeId;

    /** FK-style id of the FileVersion AFTER an edit (for the Phase-2 diff viewer). */
    @Column(name = "version_after_id")
    private Long versionAfterId;

    /** Free-form human-readable description of the event. */
    @Column(name = "details", length = 2000)
    private String details;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
