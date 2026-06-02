package com.project.filemanagement.dto;

public class AdminFilePreviewResponse {


    private String fileName;
    private String ownerName;
    private String ownerEmail;
    private String content;

    public AdminFilePreviewResponse(
            String fileName,
            String ownerName,
            String ownerEmail,
            String content
    ) {
        this.fileName = fileName;
        this.ownerName = ownerName;
        this.ownerEmail = ownerEmail;
        this.content = content;
    }

    public String getFileName() {
        return fileName;
    }

    public String getOwnerName() {
        return ownerName;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public String getContent() {
        return content;
    }
}