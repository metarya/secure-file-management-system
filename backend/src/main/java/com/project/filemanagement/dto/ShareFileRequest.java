package com.project.filemanagement.dto;

public class ShareFileRequest {

    private Long fileId;
    private String targetUserEmail;
    private String permissionType;

    public ShareFileRequest() {
    }

    public ShareFileRequest(Long fileId, String targetUserEmail, String permissionType) {
        this.fileId = fileId;
        this.targetUserEmail = targetUserEmail;
        this.permissionType = permissionType;
    }

    public Long getFileId() {
        return fileId;
    }

    public String getTargetUserEmail() {
        return targetUserEmail;
    }

    public String getPermissionType() {
        return permissionType;
    }

    public void setFileId(Long fileId) {
        this.fileId = fileId;
    }

    public void setTargetUserEmail(String targetUserEmail) {
        this.targetUserEmail = targetUserEmail;
    }

    public void setPermissionType(String permissionType) {
        this.permissionType = permissionType;
    }
}
