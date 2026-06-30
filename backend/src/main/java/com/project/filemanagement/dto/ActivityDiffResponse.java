package com.project.filemanagement.dto;

import java.util.List;

/**
 * Result of the "View Changes" diff for an edit activity.
 *
 * <p>{@code mode} is one of:
 * <ul>
 *   <li>{@code TEXT_DIFF} — {@code lines} / {@code totalAdditions} /
 *       {@code totalDeletions} are populated; binary fields are null.</li>
 *   <li>{@code BINARY_METADATA} — only the version / size / checksum metadata
 *       fields are populated; {@code lines} is null.</li>
 *   <li>{@code UNAVAILABLE} — the activity has no comparable versions.</li>
 * </ul>
 *
 * The backend fully generates the diff; the frontend only renders it.
 */
public record ActivityDiffResponse(
        Long activityId,
        String mode,
        String fileName,

        // --- TEXT_DIFF ---
        List<DiffLine> lines,
        Integer totalAdditions,
        Integer totalDeletions,

        // --- BINARY_METADATA (and shown alongside text too) ---
        Integer previousVersionNumber,
        Integer currentVersionNumber,
        Long previousSize,
        Long currentSize,
        String previousChecksum,
        String currentChecksum,
        String mimeType,

        String message
) {
    public static ActivityDiffResponse unavailable(Long activityId, String fileName, String message) {
        return new ActivityDiffResponse(activityId, "UNAVAILABLE", fileName,
                null, null, null, null, null, null, null, null, null, null, message);
    }
}
