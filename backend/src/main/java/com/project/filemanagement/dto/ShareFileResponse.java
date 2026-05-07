package com.project.filemanagement.dto;

public class ShareFileResponse {

    private String message;
    private Long permissionId;

    public ShareFileResponse() {
    }

    public ShareFileResponse(String message, Long permissionId) {
        this.message = message;
        this.permissionId = permissionId;
    }

    public String getMessage() {
        return message;
    }

    public Long getPermissionId() {
        return permissionId;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setPermissionId(Long permissionId) {
        this.permissionId = permissionId;
    }
}
