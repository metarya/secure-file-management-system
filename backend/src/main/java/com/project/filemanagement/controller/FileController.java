package com.project.filemanagement.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.project.filemanagement.dto.FileListResponse;
import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.dto.FileUploadResultResponse;
import com.project.filemanagement.dto.ShareFileRequest;
import com.project.filemanagement.dto.ShareFileResponse;
import com.project.filemanagement.dto.SharedWithMeFileResponse;
import com.project.filemanagement.service.FileService;

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
            @RequestParam("ownerId") Long ownerId,
            @RequestParam(value = "description", required = false) String description) {

        return ResponseEntity.ok(fileService.uploadFile(file, ownerId, description));
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
    @GetMapping("/preview/{fileId}")
    public ResponseEntity<byte[]> previewFile(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();

        return fileService.previewFile(fileId, userEmail);
    }

    @GetMapping("/download/{fileId}")
    public ResponseEntity<byte[]> downloadFile(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();

        return fileService.downloadFile(fileId, userEmail);
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


    @GetMapping("/shared-with-me")
    public List<SharedWithMeFileResponse> getSharedWithMeFiles(Authentication authentication) {

        String userEmail = authentication.getName();

        return fileService.getSharedWithMeFiles(userEmail);
    }

    @DeleteMapping("/shared-with-me/{fileId}")
    public ResponseEntity<String> removeSharedFileFromMyList(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                fileService.removeSharedFileFromMyList(fileId, authentication.getName())
        );
    }

    @DeleteMapping("/shared-with-me/permission/{permissionId}")
    public ResponseEntity<String> removeSharedPermissionFromMyList(
            @PathVariable Long permissionId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                fileService.removeSharedPermissionFromMyList(permissionId, authentication.getName())
        );
    }

    @DeleteMapping("/remove-shared-entry/{fileId}")
    public ResponseEntity<String> removeSharedEntryFromMySide(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        return ResponseEntity.ok(
                fileService.removeSharedEntryFromMySide(fileId, authentication.getName())
        );
    }

    @PatchMapping("/{fileId}/visibility")
    public FileListResponse updateFileVisibility(
            @PathVariable Long fileId,
            @RequestParam String visibility,
            Authentication authentication
    ) {
        String ownerEmail = authentication.getName();

        return fileService.updateFileVisibility(fileId, visibility, ownerEmail);
    }
}
