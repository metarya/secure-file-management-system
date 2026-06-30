package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import com.project.filemanagement.entity.FileVersion;

/**
 * Metadata view of a single file version. Deliberately excludes the raw bytes —
 * version content is served/compared server-side, never shipped in this JSON.
 */
public record FileVersionResponse(
        Long id,
        Long fileId,
        Integer versionNumber,
        Long fileSize,
        String checksum,
        String mimeType,
        String createdBy,
        LocalDateTime createdAt,
        String comment,
        boolean current
) {
    public static FileVersionResponse from(FileVersion v) {
        return new FileVersionResponse(
                v.getId(),
                v.getFileId(),
                v.getVersionNumber(),
                v.getFileSize(),
                v.getChecksum(),
                v.getMimeType(),
                v.getCreatedBy(),
                v.getCreatedAt(),
                v.getComment(),
                Boolean.TRUE.equals(v.getCurrent())
        );
    }
}
