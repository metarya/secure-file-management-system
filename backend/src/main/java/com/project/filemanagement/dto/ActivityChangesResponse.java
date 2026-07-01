package com.project.filemanagement.dto;

/**
 * Response for the "View Changes" action on an edit activity.
 *
 * <p>Phase 1 is a placeholder: file versioning is not yet implemented, so this
 * endpoint returns the {@code versionBefore} / {@code versionAfter} references
 * that were captured at edit time plus a status message, rather than a fully
 * rendered diff. {@code mode} signals to the frontend how to present it:
 * <ul>
 *   <li>{@code TEXT_DIFF_PENDING} — a text file whose diff will be generated in a
 *       later phase once version contents are retained;</li>
 *   <li>{@code BINARY} — a binary file; only metadata (version / size / hash) is
 *       ever shown;</li>
 *   <li>{@code UNAVAILABLE} — no version references were recorded for this event.</li>
 * </ul>
 */
public record ActivityChangesResponse(
        Long activityId,
        String mode,
        String resourceName,
        String versionBefore,
        String versionAfter,
        Long versionBeforeId,
        Long versionAfterId,
        String message
) {
}
