package com.project.filemanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

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

    public FileEntity() {
    }

    public FileEntity(User owner, String fileName, String fileType, Long fileSize, String visibility, byte[] fileData) {
        this.owner = owner;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
        this.visibility = visibility;
        this.fileData = fileData;
        this.uploadedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public User getOwner() {
        return owner;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileType() {
        return fileType;
    }

    

    public String getDescription() {
        return description;
    }
public Long getFileSize() {
        return fileSize;
    }

    public String getVisibility() {
        return visibility;
    }

    public byte[] getFileData() {
        return fileData;
    }

    public LocalDateTime getUploadedAt() {
        return uploadedAt;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setOwner(User owner) {
        this.owner = owner;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    

    public void setDescription(String description) {
        this.description = description;
    }
public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public void setFileData(byte[] fileData) {
        this.fileData = fileData;
    }

    public void setUploadedAt(LocalDateTime uploadedAt) {
        this.uploadedAt = uploadedAt;
    }

    public String getFileHash() {
        return fileHash;
    }

    public void setFileHash(String fileHash) {
        this.fileHash = fileHash;
    }


    public Long getOriginalFileSize() {
        return originalFileSize;
    }

    public void setOriginalFileSize(Long originalFileSize) {
        this.originalFileSize = originalFileSize;
    }

    public Long getCompressedFileSize() {
        return compressedFileSize;
    }

    public void setCompressedFileSize(Long compressedFileSize) {
        this.compressedFileSize = compressedFileSize;
    }

    public Boolean getCompressed() {
        return compressed;
    }

    public void setCompressed(Boolean compressed) {
        this.compressed = compressed;
    }

}
