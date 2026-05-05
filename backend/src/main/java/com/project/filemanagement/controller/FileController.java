package com.project.filemanagement.controller;

import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    private final FileService fileService;

    public FileController(FileService fileService) {
        this.fileService = fileService;
    }

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("ownerId") Long ownerId
    ) {
        FileUploadResponse response = fileService.uploadFile(file, ownerId);
        return ResponseEntity.ok(response);
    }
}
