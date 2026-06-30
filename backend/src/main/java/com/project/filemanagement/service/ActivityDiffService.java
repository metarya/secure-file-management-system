package com.project.filemanagement.service;

import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Service;

import com.project.filemanagement.dto.ActivityDiffResponse;
import com.project.filemanagement.entity.ActivityLog;
import com.project.filemanagement.entity.FileVersion;
import com.project.filemanagement.exception.ResourceNotFoundException;
import com.project.filemanagement.repository.ActivityLogRepository;
import com.project.filemanagement.repository.FileVersionRepository;

/**
 * Builds the "View Changes" diff for an edit activity by reusing the existing
 * versioning infrastructure: it reads {@code versionBeforeId} /
 * {@code versionAfterId} off the {@link ActivityLog}, loads both
 * {@link FileVersion}s, and returns either a text diff or binary metadata.
 *
 * <p>Diffs are generated only on demand (when this is called), never while the
 * activity table is loading.
 */
@Service
public class ActivityDiffService {

    private final ActivityLogRepository activityLogRepository;
    private final FileVersionRepository fileVersionRepository;
    private final FileDiffService fileDiffService;

    public ActivityDiffService(
            ActivityLogRepository activityLogRepository,
            FileVersionRepository fileVersionRepository,
            FileDiffService fileDiffService
    ) {
        this.activityLogRepository = activityLogRepository;
        this.fileVersionRepository = fileVersionRepository;
        this.fileDiffService = fileDiffService;
    }

    public ActivityDiffResponse getDiff(Long activityId) {

        ActivityLog activity = activityLogRepository.findById(activityId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity record not found"));

        String fileName = activity.getResourceName();

        Long beforeId = activity.getVersionBeforeId();
        Long afterId = activity.getVersionAfterId();

        if (afterId == null) {
            return ActivityDiffResponse.unavailable(activityId, fileName,
                    "This activity has no comparable file version.");
        }

        FileVersion after = fileVersionRepository.findById(afterId).orElse(null);
        FileVersion before = beforeId == null ? null
                : fileVersionRepository.findById(beforeId).orElse(null);

        if (after == null) {
            return ActivityDiffResponse.unavailable(activityId, fileName,
                    "The file version for this activity is no longer available.");
        }

        String mimeType = after.getMimeType();
        boolean text = fileDiffService.isTextFile(fileName, mimeType);

        if (text) {
            String oldText = before == null ? ""
                    : new String(safeBytes(before), StandardCharsets.UTF_8);
            String newText = new String(safeBytes(after), StandardCharsets.UTF_8);

            FileDiffService.TextDiff diff = fileDiffService.diff(oldText, newText);

            return new ActivityDiffResponse(
                    activityId,
                    "TEXT_DIFF",
                    fileName,
                    diff.lines(),
                    diff.additions(),
                    diff.deletions(),
                    before == null ? null : before.getVersionNumber(),
                    after.getVersionNumber(),
                    before == null ? null : before.getFileSize(),
                    after.getFileSize(),
                    before == null ? null : before.getChecksum(),
                    after.getChecksum(),
                    mimeType,
                    null
            );
        }

        // Binary: never diff content — surface a metadata comparison instead.
        return new ActivityDiffResponse(
                activityId,
                "BINARY_METADATA",
                fileName,
                null,
                null,
                null,
                before == null ? null : before.getVersionNumber(),
                after.getVersionNumber(),
                before == null ? null : before.getFileSize(),
                after.getFileSize(),
                before == null ? null : before.getChecksum(),
                after.getChecksum(),
                mimeType,
                "Binary file — showing version metadata comparison."
        );
    }

    private static byte[] safeBytes(FileVersion v) {
        return v.getFileData() == null ? new byte[0] : v.getFileData();
    }
}
