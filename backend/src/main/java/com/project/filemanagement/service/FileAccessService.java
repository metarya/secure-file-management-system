package com.project.filemanagement.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.security.AuthenticatedUserService;

/**
 * Single source of truth for object-level file authorization.
 *
 * Every read path (preview, download, byte streaming, HLS) resolves the
 * caller and the target file through this one method, so the access rule is
 * defined and enforced in exactly one place. Access is granted when the caller
 * owns the file, the file is PUBLIC, or the file has been shared with the
 * caller (VIEWER or EDITOR). Soft-deleted files are treated as not found so
 * their existence isn't disclosed.
 */
@Service
public class FileAccessService {

    private final AuthenticatedUserService authenticatedUserService;
    private final FileRepository fileRepository;
    private final FileSharingService fileSharingService;

    public FileAccessService(
            AuthenticatedUserService authenticatedUserService,
            FileRepository fileRepository,
            FileSharingService fileSharingService
    ) {
        this.authenticatedUserService = authenticatedUserService;
        this.fileRepository = fileRepository;
        this.fileSharingService = fileSharingService;
    }

    /**
     * Resolves the authenticated caller and the target file, enforces the
     * access rule, and returns the file. Throws a ResponseStatusException with
     * a consistent status on any failure.
     */
    public FileEntity authorize(Long fileId, String userEmail) {

        if (fileId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File ID is required");
        }

        // Resolve the authenticated caller through the single shared service
        // (401 if the email is missing, 404 if the user no longer exists).
        User user = authenticatedUserService.requireUser(userEmail);

        FileEntity file = fileRepository.findById(fileId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "File not found"
                ));

        // Soft-deleted files should not be accessible to normal users, and we
        // return 404 (not 403) so we don't disclose that the file exists.
        if (Boolean.TRUE.equals(file.getDeleted())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "File not found");
        }

        boolean isOwner = file.getOwner().getId().equals(user.getId());
        boolean isPublic = "PUBLIC".equalsIgnoreCase(file.getVisibility());
        boolean hasSharedAccess = fileSharingService.hasSharedPermission(
                file, user, "VIEWER", "EDITOR"
        );

        if (!(isOwner || isPublic || hasSharedAccess)) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "You are not allowed to access this file"
            );
        }

        return file;
    }
}
