package com.project.filemanagement.controller;

import com.project.filemanagement.dto.FileListResponse;
import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.dto.FileUploadResultResponse;
import com.project.filemanagement.dto.ShareFileRequest;
import com.project.filemanagement.dto.ShareFileResponse;
import com.project.filemanagement.service.FileService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
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

    @GetMapping("/my-files")
    public ResponseEntity<List<FileListResponse>> getMyFiles(@RequestParam Long ownerId) {
        return ResponseEntity.ok(fileService.getMyFiles(ownerId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<FileListResponse>> searchMyFiles(
            @RequestParam Long ownerId,
            @RequestParam String name) {

        return ResponseEntity.ok(fileService.searchMyFiles(ownerId, name));
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> downloadFile(
            @PathVariable Long fileId,
            @RequestParam Long userId) {

        return fileService.downloadFile(fileId, userId);
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<String> deleteFile(
            @PathVariable Long fileId,
            @RequestParam Long userId) {

        return ResponseEntity.ok(fileService.deleteFile(fileId, userId));
    }


    @PostMapping("/share")
    public ResponseEntity<ShareFileResponse> shareFile(
            @RequestBody ShareFileRequest request,
            Authentication authentication) {

        return ResponseEntity.ok(
                fileService.shareFile(request, authentication.getName())
        );
    }

}
