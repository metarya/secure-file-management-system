package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class AdminUserResponse {

    private final Long id;
    private final String fullName;
    private final String email;
    private final String role;
    private final String status;
    private final LocalDateTime createdAt;
}