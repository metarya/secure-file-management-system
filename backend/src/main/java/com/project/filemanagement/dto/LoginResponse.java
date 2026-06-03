package com.project.filemanagement.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class LoginResponse {

    private String message;
    private Long userId;
    private String fullName;
    private String email;
    private String token;
    private String role;

    // Old constructor kept so existing login code does not break
    public LoginResponse(
            String message,
            Long userId,
            String fullName,
            String email
    ) {
        this.message = message;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.token = null;
        this.role = null;
    }

    // New constructor for JWT login success
    public LoginResponse(
            String message,
            Long userId,
            String fullName,
            String email,
            String token,
            String role
    ) {
        this.message = message;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.token = token;
        this.role = role;
    }
}