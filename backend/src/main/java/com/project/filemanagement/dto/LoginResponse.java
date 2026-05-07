package com.project.filemanagement.dto;

public class LoginResponse {

    private String message;
    private Long userId;
    private String fullName;
    private String email;
    private String token;

    public LoginResponse() {
    }

    // Old constructor kept so existing login code does not break
    public LoginResponse(String message, Long userId, String fullName, String email) {
        this.message = message;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.token = null;
    }

    // New constructor for JWT login success
    public LoginResponse(String message, Long userId, String fullName, String email, String token) {
        this.message = message;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public Long getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    public String getEmail() {
        return email;
    }

    public String getToken() {
        return token;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setToken(String token) {
        this.token = token;
    }
}
