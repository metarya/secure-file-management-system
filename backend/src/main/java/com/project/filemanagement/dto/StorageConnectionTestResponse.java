package com.project.filemanagement.dto;

/** Result of a "Test connection" request for a storage provider. */
public record StorageConnectionTestResponse(
        boolean success,
        String message
) {
}
