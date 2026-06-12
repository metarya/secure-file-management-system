package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class PermissionResponse {

    private final String code;
    private final String description;
}
