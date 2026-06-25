package com.project.filemanagement.controller;

import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.project.filemanagement.dto.FileListResponse;
import com.project.filemanagement.dto.FileUploadResponse;
import com.project.filemanagement.dto.RenameFileRequest;
import com.project.filemanagement.dto.ShareFileRequest;
import com.project.filemanagement.dto.ShareFileResponse;
import com.project.filemanagement.dto.SharedWithMeFileResponse;
import com.project.filemanagement.dto.UpdateFileContentRequest;
import com.project.filemanagement.dto.UpdateFileContentResponse;
import com.project.filemanagement.dto.UpdateFileDescriptionRequest;
import com.project.filemanagement.security.AuthenticatedUserService;
import com.project.filemanagement.service.FileService;

@RestController
@RequestMapping("/api/files")
public class FileController {

    private final FileService fileService;
    private final AuthenticatedUserService authenticatedUserService;

    public FileController(
            FileService fileService,
            AuthenticatedUserService authenticatedUserService) {
        this.fileService = fileService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "description", required = false) String description,
            Authentication authentication) {

        Long ownerId = authenticatedUserService.requireUserId(authentication);

        return ResponseEntity.ok(fileService.uploadFile(file, ownerId, description));
    }

    @GetMapping("/my-files")
    public ResponseEntity<List<FileListResponse>> getMyFiles(Authentication authentication) {
        Long ownerId = authenticatedUserService.requireUserId(authentication);
        return ResponseEntity.ok(fileService.getMyFiles(ownerId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<FileListResponse>> searchMyFiles(
            @RequestParam String name,
            Authentication authentication) {

        Long ownerId = authenticatedUserService.requireUserId(authentication);

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

    // Range-aware streaming for audio/video (enables seek/scrub in the player).
    @GetMapping("/stream/{fileId}")
    public ResponseEntity<byte[]> streamFile(
            @PathVariable Long fileId,
            @RequestHeader(value = HttpHeaders.RANGE, required = false) String rangeHeader,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();

        return fileService.streamFile(fileId, userEmail, rangeHeader);
    }

    // Server-rendered Markdown (.md / .txt) as sanitized HTML for preview.
    @GetMapping("/preview/markdown/{fileId}")
    public ResponseEntity<String> previewMarkdown(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        String userEmail = authentication.getName();

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body(fileService.renderMarkdownPreview(fileId, userEmail));
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<String> deleteFile(
            @PathVariable Long fileId,
            Authentication authentication) {

        Long userId = authenticatedUserService.requireUserId(authentication);

        return ResponseEntity.ok(fileService.deleteFile(fileId, userId));
    }

    // --- Recycle bin (owner-scoped) ------------------------------------
    @GetMapping("/recycle-bin")
    public ResponseEntity<List<FileListResponse>> getRecycleBin(Authentication authentication) {
        Long ownerId = authenticatedUserService.requireUserId(authentication);
        return ResponseEntity.ok(fileService.getDeletedFiles(ownerId));
    }

    @PatchMapping("/{fileId}/restore")
    public ResponseEntity<String> restoreFile(
            @PathVariable Long fileId,
            Authentication authentication) {

        Long ownerId = authenticatedUserService.requireUserId(authentication);

        return ResponseEntity.ok(fileService.restoreOwnedFile(fileId, ownerId));
    }

    @DeleteMapping("/{fileId}/permanent")
    public ResponseEntity<String> permanentlyDeleteFile(
            @PathVariable Long fileId,
            Authentication authentication) {

        Long ownerId = authenticatedUserService.requireUserId(authentication);

        return ResponseEntity.ok(fileService.permanentlyDeleteFile(fileId, ownerId));
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

@PutMapping("/{fileId}/content")
public ResponseEntity<UpdateFileContentResponse> updateFileContent(
        @PathVariable Long fileId,
        @RequestBody UpdateFileContentRequest request,
        Authentication authentication
) {

    fileService.updateFileContent(
            fileId,
            authentication.getName(),
            request.getContent()
    );

    return ResponseEntity.ok(
            new UpdateFileContentResponse(
                    "File updated successfully"
            )
    );
}

@PutMapping("/{fileId}/rename")
public ResponseEntity<String> renameFile(
        @PathVariable Long fileId,
        @RequestBody RenameFileRequest request,
        Authentication authentication
) {

    fileService.renameFile(
            fileId,
            authentication.getName(),
            request.getNewFileName()
    );

    return ResponseEntity.ok("File renamed successfully");
}

@PutMapping("/{fileId}/description")
public ResponseEntity<String> updateDescription(
        @PathVariable Long fileId,
        @RequestBody UpdateFileDescriptionRequest request,
        Authentication authentication
) {

    fileService.updateFileDescription(
            fileId,
            authentication.getName(),
            request.getDescription()
    );

    return ResponseEntity.ok(
            "Description updated successfully"
    );
}

}
