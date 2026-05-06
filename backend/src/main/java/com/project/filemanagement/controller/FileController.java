package com.project.filemanagement.controller;

import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.dto.FileUploadResultResponse;
import com.project.filemanagement.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ownerId") Long ownerId) {

        return ResponseEntity.ok(fileService.uploadFile(file, ownerId));
    }

    @PostMapping("/upload-multiple")
    public ResponseEntity<List<FileUploadResultResponse>> uploadMultipleFiles(
            @RequestParam("files") MultipartFile[] files,
            @RequestParam("ownerId") Long ownerId) {

        return ResponseEntity.ok(fileService.uploadMultipleFiles(files, ownerId));
    }
}
