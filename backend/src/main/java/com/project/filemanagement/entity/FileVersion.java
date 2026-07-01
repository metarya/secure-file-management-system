package com.project.filemanagement.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * An immutable snapshot of a file's content at a point in time.
 *
 * <p>Every edit creates a new {@code FileVersion} rather than overwriting the
 * previous one; exactly one version per file is flagged {@link #current}, and
 * {@link FileEntity#getCurrentVersionId()} points at it. Older versions are never
 * mutated, so the full history remains available.
 *
 * <p>Design notes:
 * <ul>
 *   <li>{@link #fileData} holds the <em>raw, uncompressed</em> content bytes, so a
 *       version is self-contained and a later phase can diff two versions by
 *       reading their bytes directly — without depending on {@link FileEntity}'s
 *       compression metadata.</li>
 *   <li>Only fields that are genuinely per-version live here. Owner, file name,
 *       description, visibility, compression details etc. stay on
 *       {@link FileEntity} and are not duplicated.</li>
 * </ul>
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "file_versions",
        indexes = {
                @Index(name = "idx_file_versions_file_id", columnList = "file_id"),
                @Index(name = "idx_file_versions_file_current", columnList = "file_id,is_current")
        }
)
public class FileVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The file this version belongs to. */
    @Column(name = "file_id", nullable = false)
    private Long fileId;

    /** Monotonic, 1-based version number within a single file (v1, v2, v3 …). */
    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    /** Raw (uncompressed) content bytes captured for this version. */
    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    private byte[] fileData;

    /** Logical size in bytes of the raw content. */
    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    /** SHA-256 of the raw content (matches {@code FileEntity.fileHash} for the latest). */
    @Column(name = "checksum", length = 64)
    private String checksum;

    /** MIME type of the content at the time the version was created. */
    @Column(name = "mime_type", length = 255)
    private String mimeType;

    /** Email of the user who created this version. */
    @Column(name = "created_by", length = 150)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /** Optional human note describing the change. */
    @Column(name = "comment", length = 500)
    private String comment;

    /** Whether this is the current/latest version of the file. */
    @Column(name = "is_current", nullable = false)
    private Boolean current;
}
