package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.RequiredArgsConstructor;

@Getter
@Setter
@RequiredArgsConstructor
public class LoginRequest {

    private final String email;
    private final String password;
}
