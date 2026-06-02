package com.project.filemanagement.dto;

public class AdminResetPasswordResponse {

    private final String email;
    private final String temporaryPassword;

    public AdminResetPasswordResponse(
            String email,
            String temporaryPassword
    ) {
        this.email = email;
        this.temporaryPassword = temporaryPassword;
    }

    public String getEmail() {
        return email;
    }

    public String getTemporaryPassword() {
        return temporaryPassword;
    }
}