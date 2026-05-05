package com.project.filemanagement.dto;

public class FileUploadResponse {

    private String message;
    private Long fileId;
    private String fileName;
    private String fileType;
    private Long fileSize;

    public FileUploadResponse() {
    }

    public FileUploadResponse(String message, Long fileId, String fileName, String fileType, Long fileSize) {
        this.message = message;
        this.fileId = fileId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    public String getMessage() {
        return message;
    }

    public Long getFileId() {
        return fileId;
    }

    public String getFileName() {
        return fileName;
    }

    public String getFileType() {
        return fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }
}
