package com.project.filemanagement.dto;

import io.micrometer.common.lang.NonNull;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ShareFileRequest {

    @NonNull
    private Long fileId;

    @NotBlank
    @Email
    private String targetUserEmail;

    @NotBlank
    private String permissionType;
}