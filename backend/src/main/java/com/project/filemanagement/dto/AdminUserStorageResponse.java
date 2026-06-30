package com.project.filemanagement.dto;

/**
 * Read-only view for administrators: which storage provider each user is using.
 * Contains no credentials — administrators may VIEW providers but never see
 * secrets or change another user's configuration.
 */
public record AdminUserStorageResponse(
        Long userId,
        String fullName,
        String email,
        String storageProvider
) {
}
