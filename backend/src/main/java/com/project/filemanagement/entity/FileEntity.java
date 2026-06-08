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

    @Column(nullable = false, length = 20)
    private String visibility = "PRIVATE";

    @Lob
    @Column(name = "file_data", columnDefinition = "LONGBLOB")
    private byte[] fileData;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt = LocalDateTime.now();

    @Column(name = "is_deleted")
    private Boolean deleted = false;

    public FileEntity(User owner, String fileName, String fileType, Long fileSize, String visibility, byte[] fileData) {
        this.owner = owner;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.visibility = visibility;
        this.fileData = fileData;
        this.uploadedAt = LocalDateTime.now();
    }
}
