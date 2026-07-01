package com.project.filemanagement.controller;

import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.dto.ActivityChangesResponse;
import com.project.filemanagement.dto.ActivityDiffResponse;
import com.project.filemanagement.dto.ActivityLogDetailResponse;
import com.project.filemanagement.dto.ActivityLogResponse;
import com.project.filemanagement.dto.PageResponse;
import com.project.filemanagement.service.ActivityDiffService;
import com.project.filemanagement.service.ActivityLogService;
import com.project.filemanagement.util.PageRequests;

/**
 * Admin-only System Activity Log API.
 *
 * <p>Every endpoint is gated behind {@code USER:VIEW} (the same admin-console
 * authority used across {@code AdminController}), so regular users can never
 * read system activity. Listing reuses the shared server-side
 * pagination/sorting/search infrastructure; the default is 10 records per page,
 * newest first.
 */
@RestController
@RequestMapping("/api/admin/activity-logs")
@PreAuthorize("hasAuthority('USER:VIEW')")
public class ActivityLogController {

    private final ActivityLogService activityLogService;
    private final ActivityDiffService activityDiffService;

    public ActivityLogController(
            ActivityLogService activityLogService,
            ActivityDiffService activityDiffService
    ) {
        this.activityLogService = activityLogService;
        this.activityDiffService = activityDiffService;
    }

    // Allowlist of sortable columns -> entity property paths. Anything not here
    // falls back to the default, so arbitrary property paths can't be injected.
    private static final Map<String, String> ACTIVITY_SORT_FIELDS = Map.of(
            "timestamp", "createdAt",
            "actorName", "actorName",
            "actorEmail", "actorEmail",
            "action", "action",
            "resourceName", "resourceName",
            "status", "status"
    );

    private static final String DEFAULT_ACTIVITY_SORT = "timestamp";

    @GetMapping
    public PageResponse<ActivityLogResponse> getActivityLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = DEFAULT_ACTIVITY_SORT) String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequests.of(
                page, size, sort, direction, ACTIVITY_SORT_FIELDS, DEFAULT_ACTIVITY_SORT);
        return activityLogService.getLogsPage(search, pageable);
    }

    @GetMapping("/{id}")
    public ActivityLogDetailResponse getActivityDetail(@PathVariable Long id) {
        return activityLogService.getDetail(id);
    }

    /** "View Changes" reference metadata for file-edit activities. */
    @GetMapping("/{id}/changes")
    public ActivityChangesResponse getActivityChanges(@PathVariable Long id) {
        return activityLogService.getChanges(id);
    }

    /**
     * GitHub-style "View Changes" diff for an edit activity. Generated on demand
     * only (never while loading the activity table): loads the before/after
     * {@link com.project.filemanagement.entity.FileVersion}s referenced by the
     * activity and returns a TEXT_DIFF or BINARY_METADATA payload.
     */
    @GetMapping("/{id}/diff")
    public ActivityDiffResponse getActivityDiff(@PathVariable Long id) {
        return activityDiffService.getDiff(id);
    }
}
