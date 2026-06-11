package com.project.filemanagement.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ApiErrorResponse {

    private final boolean success;
    private final String message;
    private final LocalDateTime timestamp;

}