package com.project.filemanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record ChangeUserStorageProviderRequest(
        @NotBlank(message = "storageProvider is required")
        String storageProvider
) {
}
