package com.project.filemanagement.controller;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.dto.ForgotPasswordRequest;
import com.project.filemanagement.dto.LoginRequest;
import com.project.filemanagement.dto.LoginResponse;
import com.project.filemanagement.dto.RegisterRequest;
import com.project.filemanagement.dto.ResetPasswordRequest;
import com.project.filemanagement.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // ---------------- REGISTER ----------------
    @PostMapping("/register")
    public ResponseEntity<String> registerUser(
            @RequestBody RegisterRequest request) {

        String response = authService.registerUser(request);

        if ("User registered successfully".equalsIgnoreCase(response)) {
            return ResponseEntity.ok(response);
        }

        return ResponseEntity.badRequest().body(response);
    }

    // ---------------- LOGIN ----------------
    @PostMapping("/login")
    public ResponseEntity<LoginResponse> loginUser(
            @RequestBody LoginRequest request) {

        LoginResponse response = authService.loginUser(request);

        if ("Login successful".equalsIgnoreCase(response.getMessage())) {
            return ResponseEntity.ok(response);
        }

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(response);
    }

    // ---------------- LOGOUT ----------------
    @PostMapping("/logout")
    public ResponseEntity<String> logout(Authentication authentication) {

        if (authentication != null) {
            authService.logout(authentication.getName());
        }

        return ResponseEntity.ok("Logged out");
    }

        @PostMapping("/forgot-password")
        public ResponseEntity<?> forgotPassword(
                @RequestBody ForgotPasswordRequest request
        ) {

            String response =
                authService.forgotPassword(request.getEmail());

            return ResponseEntity.ok(response);
        }

        @PostMapping("/reset-password")
        public ResponseEntity<?> resetPassword(
                @RequestBody ResetPasswordRequest request
        ) {

            String response =
                authService.resetPassword(
                        request.getEmail(),
                        request.getOtp(),
                        request.getNewPassword()
                );

            return ResponseEntity.ok(response);
        }
    }