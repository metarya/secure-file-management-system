package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.RequiredArgsConstructor;


@Getter
@RequiredArgsConstructor

public class AdminResetPasswordResponse {

    private final String email;
    private final String temporaryPassword;

}