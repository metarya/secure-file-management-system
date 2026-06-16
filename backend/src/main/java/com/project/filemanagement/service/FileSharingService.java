package com.project.filemanagement.service;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.dto.ShareFileRequest;
import com.project.filemanagement.dto.ShareFileResponse;
import com.project.filemanagement.dto.SharedWithMeFileResponse;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.FilePermission;
import com.project.filemanagement.entity.PermissionType;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.FilePermissionRepository;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.PermissionTypeRepository;
import com.project.filemanagement.repository.UserRepository;

/**
 * Owns the file-sharing domain: granting/updating permissions, listing files
 * shared with a user, and revoking shared access. Extracted from FileService.
 */
@Service
public class FileSharingService {

    private final FileRepository fileRepository;
    private final UserRepository userRepository;
    private final FilePermissionRepository filePermissionRepository;
    private final PermissionTypeRepository permissionTypeRepository;

    public FileSharingService(
            FileRepository fileRepository,
            UserRepository userRepository,
            FilePermissionRepository filePermissionRepository,
            PermissionTypeRepository permissionTypeRepository
    ) {
        this.fileRepository = fileRepository;
        this.userRepository = userRepository;
        this.filePermissionRepository = filePermissionRepository;
        this.permissionTypeRepository = permissionTypeRepository;
    }

    public ShareFileResponse shareFile(ShareFileRequest request, String ownerEmail) {

        if (ownerEmail == null || ownerEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Share request is required");
        }

        if (request.getFileId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (request.getTargetUserEmail() == null || request.getTargetUserEmail().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Target user email is required");
        }

        if (request.getPermissionType() == null || request.getPermissionType().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Permission type is required");
        }

        User owner = userRepository.findByEmail(ownerEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated owner not found"));

        FileEntity file = fileRepository.findById(request.getFileId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        boolean isOwner = file.getOwner().getId().equals(owner.getId());

        boolean canShare = hasSharedPermission(file, owner, "VIEWER", "EDITOR");

        if (!isOwner && !canShare) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only owner, viewer, or editor can share this file");
        }

        User targetUser = userRepository.findByEmail(request.getTargetUserEmail().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Target user is not registered"));

        if (owner.getId().equals(targetUser.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Owner cannot share file with themselves");
        }

        String requestedPermissionCode = request.getPermissionType().trim().toUpperCase();

        if (!isOwner) {
            boolean isViewer = hasSharedPermission(file, owner, "VIEWER");

            if (isViewer && "EDITOR".equalsIgnoreCase(requestedPermissionCode)) {
                throw new ResponseStatusException(
                        HttpStatus.FORBIDDEN,
                        "Viewer cannot grant editor permission"
                );
            }
        }

        PermissionType permissionType = permissionTypeRepository
                .findByCodeAndActiveTrue(requestedPermissionCode)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Invalid or inactive permission type"
                ));

        Optional<FilePermission> existingPermission =
                filePermissionRepository.findByFileAndSharedWithUser(file, targetUser);

        if (existingPermission.isPresent()) {
            FilePermission permission = existingPermission.get();
            String currentPermissionCode = permission.getPermissionType().getCode();

            if (currentPermissionCode != null && currentPermissionCode.equalsIgnoreCase(requestedPermissionCode)) {
                return new ShareFileResponse("Permission already set", permission.getId());
            }

            permission.setPermissionType(permissionType);
            FilePermission updatedPermission = filePermissionRepository.save(permission);

            return new ShareFileResponse("File permission updated successfully", updatedPermission.getId());
        }

        FilePermission permission = new FilePermission();
        permission.setFile(file);
        permission.setSharedWithUser(targetUser);
        permission.setPermissionType(permissionType);

        FilePermission savedPermission = filePermissionRepository.save(permission);

        return new ShareFileResponse("File shared successfully", savedPermission.getId());
    }

    public List<SharedWithMeFileResponse> getSharedWithMeFiles(String userEmail) {

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        User sharedUser = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));

        return filePermissionRepository.findBySharedWithUser(sharedUser)
                .stream()
                .filter(permission -> !Boolean.TRUE.equals(permission.getFile().getDeleted()))
                .map(permission -> {
                    FileEntity file = permission.getFile();
                    User owner = file.getOwner();

                    return new SharedWithMeFileResponse(
                            file.getId(),
                            file.getFileName(),
                            file.getDescription(),
                            file.getFileType(),
                            file.getFileSize(),
                            file.getOriginalFileSize(),
                            file.getCompressedFileSize(),
                            file.getCompressed(),
                            file.getVisibility(),
                            file.getUploadedAt(),
                            owner.getId(),
                            owner.getFullName(),
                            owner.getEmail(),
                            permission.getId(),
                            permission.getPermissionType().getCode(),
                            permission.getCreatedAt()
                    );
                })
                .toList();
    }

    public String removeSharedFileFromMyList(Long fileId, String userEmail) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        User sharedUser = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found"));

        if (file.getOwner().getId().equals(sharedUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Owner cannot remove file as shared file. Use delete file instead."
            );
        }

        FilePermission permission = filePermissionRepository.findByFileAndSharedWithUser(file, sharedUser)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "This file is not shared with your account"
                ));

        filePermissionRepository.delete(permission);

        return "Shared file removed from your list";
    }

    public String removeSharedPermissionFromMyList(Long permissionId, String userEmail) {

        if (permissionId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Permission ID is required");
        }

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        User sharedUser = userRepository.findByEmail(userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Authenticated user not found"));

        FilePermission permission = filePermissionRepository.findById(permissionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared permission not found"));

        if (!permission.getSharedWithUser().getId().equals(sharedUser.getId())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to remove this shared file"
            );
        }

        filePermissionRepository.delete(permission);

        return "Shared file removed from your list";
    }

    public String removeSharedEntryFromMySide(Long fileId, String userEmail) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user email is required");
        }

        FilePermission permission = filePermissionRepository
                .findByFile_IdAndSharedWithUser_Email(fileId, userEmail.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Shared file entry not found for this user"
                ));

        filePermissionRepository.delete(permission);

        return "Shared file removed from your list";
    }

    /**
     * Shared permission check, reused by FileContentService and
     * FileStreamingService so access rules live in exactly one place.
     */
    public boolean hasSharedPermission(FileEntity file, User user, String... allowedCodes) {

        return filePermissionRepository.findByFileAndSharedWithUser(file, user)
                .map(permission -> {
                    String code = permission.getPermissionType().getCode();

                    if (code == null) {
                        return false;
                    }

                    for (String allowedCode : allowedCodes) {
                        if (allowedCode.equalsIgnoreCase(code)) {
                            return true;
                        }
                    }

                    return false;
                })
                .orElse(false);
    }
}
