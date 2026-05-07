package com.project.filemanagement.dto;

import java.time.LocalDateTime;

public class SharedFileResponse {

    private Long permissionId;
    private Long fileId;
    private String fileName;
    private String fileType;
    private Long originalFileSize;
    private Long compressedFileSize;
    private String visibility;
    private Long ownerId;
    private String ownerName;
    private Long sharedWithUserId;
    private String sharedWithEmail;
    private String permissionType;
    private LocalDateTime sharedAt;

    public SharedFileResponse() {
    }

    public SharedFileResponse(
            Long permissionId,
            Long fileId,
            String fileName,
            String fileType,
            Long originalFileSize,
            Long compressedFileSize,
            String visibility,
            Long ownerId,
            String ownerName,
            Long sharedWithUserId,
            String sharedWithEmail,
            String permissionType,
            LocalDateTime sharedAt
    ) {
        this.permissionId = permissionId;
        this.fileId = fileId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.originalFileSize = originalFileSize;
        this.compressedFileSize = compressedFileSize;
        this.visibility = visibility;
        this.ownerId = ownerId;
        this.ownerName = ownerName;
        this.sharedWithUserId = sharedWithUserId;
        this.sharedWithEmail = sharedWithEmail;
        this.permissionType = permissionType;
        this.sharedAt = sharedAt;
    }

    public Long getPermissionId() {
        return permissionId;
    }

    public void setPermissionId(Long permissionId) {
        this.permissionId = permissionId;
    }

    public Long getFileId() {
        return fileId;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
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

    public String getVisibility() {
        return visibility;
    }

    public void setVisibility(String visibility) {
        this.visibility = visibility;
    }

    public Long getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Long ownerId) {
        this.ownerId = ownerId;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public void setOwnerName(String ownerName) {
        this.ownerName = ownerName;
    }

    public Long getSharedWithUserId() {
        return sharedWithUserId;
    }

    public void setSharedWithUserId(Long sharedWithUserId) {
        this.sharedWithUserId = sharedWithUserId;
    }

    public String getSharedWithEmail() {
        return sharedWithEmail;
    }

    public void setSharedWithEmail(String sharedWithEmail) {
        this.sharedWithEmail = sharedWithEmail;
    }

    public String getPermissionType() {
        return permissionType;
    }

    public void setPermissionType(String permissionType) {
        this.permissionType = permissionType;
    }

    public LocalDateTime getSharedAt() {
        return sharedAt;
    }

    public void setSharedAt(LocalDateTime sharedAt) {
        this.sharedAt = sharedAt;
    }
}
