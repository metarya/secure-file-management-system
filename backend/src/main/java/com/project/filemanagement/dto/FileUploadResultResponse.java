package com.project.filemanagement.dto;

public class FileUploadResultResponse {

    private Boolean success;
    private String message;
    private Long fileId;
    private String fileName;
    private String fileType;
    private Long fileSize;

    public FileUploadResultResponse() {
    }

    public FileUploadResultResponse(Boolean success, String message, Long fileId,
                                    String fileName, String fileType, Long fileSize) {
        this.success = success;
        this.message = message;
        this.fileId = fileId;
        this.fileName = fileName;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    public Boolean getSuccess() {
        return success;
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
