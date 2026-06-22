package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.RequiredArgsConstructor;

@Getter
@Setter
@RequiredArgsConstructor

public class ForgotPasswordRequest {

    private final String email;
}