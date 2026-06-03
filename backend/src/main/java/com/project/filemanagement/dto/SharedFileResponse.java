package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
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
}