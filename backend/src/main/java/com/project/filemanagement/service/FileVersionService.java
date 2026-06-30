package com.project.filemanagement.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.filemanagement.dto.FileVersionResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.FileVersion;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.FileVersionRepository;

/**
 * Owns the lifecycle of immutable {@link FileVersion} snapshots.
 *
 * <p>Versions are append-only: an edit never mutates an existing version, it
 * creates a new one, flips the {@code is_current} flag, and repoints
 * {@link FileEntity#setCurrentVersionId(Long)} at the new row. Reads are gated
 * through {@link FileAccessService} so the same owner / public / shared rules
 * that protect preview & download also protect version history.
 */
@Service
public class FileVersionService {

    private final FileVersionRepository fileVersionRepository;
    private final FileRepository fileRepository;
    private final FileAccessService fileAccessService;

    public FileVersionService(
            FileVersionRepository fileVersionRepository,
            FileRepository fileRepository,
            FileAccessService fileAccessService
    ) {
        this.fileVersionRepository = fileVersionRepository;
        this.fileRepository = fileRepository;
        this.fileAccessService = fileAccessService;
    }

    /** Result of appending a version: the id of the prior current version (if any) and the new one. */
    public record VersionTransition(Long previousVersionId, FileVersion newVersion) {
    }

    // ----------------------------------------------------------------------
    // Write
    // ----------------------------------------------------------------------

    /**
     * Creates the very first version (v1) for a freshly uploaded file and points
     * the file at it. Safe to call once per upload.
     */
    @Transactional
    public FileVersion createInitialVersion(
            FileEntity file,
            byte[] rawBytes,
            String checksum,
            String mimeType,
            String createdByEmail,
            String comment
    ) {
        FileVersion version = append(file, rawBytes, checksum, mimeType, createdByEmail, comment);
        return version;
    }

    /**
     * Appends a new version after an edit. The previously-current version is
     * preserved (only its {@code is_current} flag flips to false), a new version
     * is created and marked current, and the file is repointed at it.
     *
     * @return the prior current version id (for {@code versionBeforeId} in the
     *         activity log) and the newly created version.
     */
    @Transactional
    public VersionTransition recordNewVersion(
            FileEntity file,
            byte[] rawBytes,
            String checksum,
            String mimeType,
            String createdByEmail,
            String comment
    ) {
        Long previousVersionId = file.getCurrentVersionId();
        FileVersion newVersion = append(file, rawBytes, checksum, mimeType, createdByEmail, comment);
        return new VersionTransition(previousVersionId, newVersion);
    }

    /**
     * Shared append logic: demote any existing current version, compute the next
     * version number from the DB (MAX+1 — correct for new and legacy files), save
     * the immutable snapshot, and repoint the file at it.
     */
    private FileVersion append(
            FileEntity file,
            byte[] rawBytes,
            String checksum,
            String mimeType,
            String createdByEmail,
            String comment
    ) {
        // Demote the previous current version (history stays intact otherwise).
        fileVersionRepository.findByFileIdAndCurrentTrue(file.getId())
                .ifPresent(prev -> {
                    prev.setCurrent(false);
                    fileVersionRepository.save(prev);
                });

        Integer maxVersion = fileVersionRepository.findMaxVersionNumber(file.getId());
        int nextNumber = (maxVersion == null ? 0 : maxVersion) + 1;

        FileVersion version = FileVersion.builder()
                .fileId(file.getId())
                .versionNumber(nextNumber)
                .fileData(rawBytes)
                .fileSize(rawBytes == null ? 0L : (long) rawBytes.length)
                .checksum(checksum)
                .mimeType(mimeType)
                .createdBy(createdByEmail)
                .createdAt(LocalDateTime.now())
                .comment(comment)
                .current(true)
                .build();

        FileVersion saved = fileVersionRepository.save(version);

        // FileEntity always references the latest version.
        file.setCurrentVersionId(saved.getId());
        fileRepository.save(file);

        return saved;
    }

    // ----------------------------------------------------------------------
    // Read (access-controlled)
    // ----------------------------------------------------------------------

    /** All versions of a file (newest first), after an access check. */
    public List<FileVersionResponse> getVersions(Long fileId, String requesterEmail) {
        fileAccessService.authorize(fileId, requesterEmail); // throws 403/404 as appropriate
        return fileVersionRepository.findByFileIdOrderByVersionNumberDesc(fileId)
                .stream()
                .map(FileVersionResponse::from)
                .toList();
    }

    /** A single version of a file, after an access check. */
    public FileVersionResponse getVersion(Long fileId, Long versionId, String requesterEmail) {
        fileAccessService.authorize(fileId, requesterEmail);
        return fileVersionRepository.findByIdAndFileId(versionId, fileId)
                .map(FileVersionResponse::from)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Version not found"));
    }
}
