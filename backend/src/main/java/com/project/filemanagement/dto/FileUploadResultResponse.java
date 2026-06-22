package com.project.filemanagement.dto;


import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor

public class FileUploadResultResponse {

    private final Boolean success;
    private final String message;
    private final Long fileId;
    private final String fileName;
    private final String fileType;
    private final Long fileSize;
}
