package com.project.filemanagement.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "files")
public class FileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Many files can belong to one user
    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_type", nullable = false, length = 20)
    private String fileType;

    @Column(name = "content_type", length = 255)
    private String contentType;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "file_hash", length = 64)
    private String fileHash;

    @Column(name = "original_file_size")
    private Long originalFileSize;

    @Column(name = "compressed_file_size")
    private Long compressedFileSize;

    @Column(name = "is_compressed")
    private Boolean compressed;

    @Column(name = "compression_algorithm", length = 50)
    private String compressionAlgorithm;

    @Column(name = "requires_decompression")
    private Boolean requiresDecompression = false;

    @Column(name = "hls_folder", length = 255)
    private String hlsFolder;

    @Column(name = "hls_playlist", length = 255)
    private String hlsPlaylist;

    @Column(name = "hls_generated")
    private Boolean hlsGenerated = false;

    @Column(nullable = false, length = 20)
    private String visibility = "PRIVATE";

    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    private byte[] fileData;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Column(name = "is_deleted")
    private Boolean deleted = false;

    // Points at the latest FileVersion (see FileVersionService). Kept as a plain
    // id rather than a JPA relationship to avoid a circular files <-> file_versions
    // FK cycle; referential integrity is maintained in the service layer.
    @Column(name = "current_version_id")
    private Long currentVersionId;

    // Which storage backend holds this file's bytes. LOCAL keeps bytes in
    // file_data (the existing DB-blob behavior); cloud providers store them
    // externally and record the provider key in storage_key.
    @Column(name = "storage_provider", length = 32)
    private String storageProvider = "LOCAL";

    @Column(name = "storage_key", length = 1024)
    private String storageKey;

    public FileEntity(
            User owner,
            String fileName,
            String fileType,
            Long fileSize,
            String visibility,
            byte[] fileData) {

        this.owner = owner;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.visibility = visibility;
        this.fileData = fileData;
        this.uploadedAt = LocalDateTime.now();
    }
}