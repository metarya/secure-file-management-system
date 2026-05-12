package com.project.filemanagement.service;







import java.util.UUID;import java.util.Map;import java.util.HashMap;import java.time.LocalDateTime;import com.project.filemanagement.dto.ResetPasswordRequest;import com.project.filemanagement.dto.ForgotPasswordRequest;import com.project.filemanagement.dto.LoginRequest;
import com.project.filemanagement.dto.LoginResponse;
import com.project.filemanagement.dto.RegisterRequest;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.security.JwtUtil;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtUtil = jwtUtil;
    }

    public String registerUser(RegisterRequest request) {

        if (request.getFullName() == null || request.getFullName().isBlank()) {
            return "Full name is required";
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return "Email is required";
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return "Password is required";
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            return "Email already exists";
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());

        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPasswordHash(hashedPassword);

        userRepository.save(user);

        return "User registered successfully";
    }

    public LoginResponse loginUser(LoginRequest request) {

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return new LoginResponse("Email is required", null, null, null);
        }

        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return new LoginResponse("Password is required", null, null, null);
        }

        Optional<User> userOptional = userRepository.findByEmail(request.getEmail());

        if (userOptional.isEmpty()) {
            return new LoginResponse("Invalid email or password", null, null, null);
        }

        User user = userOptional.get();

        boolean passwordMatched = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash()
        );

        if (!passwordMatched) {
            return new LoginResponse("Invalid email or password", null, null, null);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getFullName());

        return new LoginResponse(
                "Login successful",
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                token
        );
    }
    public Map<String, Object> forgotPassword(ForgotPasswordRequest request) {
        Map<String, Object> response = new HashMap<>();

        response.put("message", "If this email exists, a reset token has been generated.");
        response.put("resetToken", null);

        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return response;
        }

        userRepository.findByEmail(request.getEmail().trim()).ifPresent(user -> {
            String token = UUID.randomUUID().toString();

            user.setPasswordResetToken(token);
            user.setPasswordResetTokenExpiresAt(LocalDateTime.now().plusMinutes(15));

            userRepository.save(user);

            response.put("message", "Reset token generated. Demo token is shown below.");
            response.put("resetToken", token);
        });

        return response;
    }


    public String resetPassword(ResetPasswordRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Reset request is required");
        }

        if (request.getEmail() == null || request.getEmail().isBlank()) {
            throw new IllegalArgumentException("Registered email is required");
        }

        if (request.getNewPassword() == null || request.getNewPassword().isBlank()) {
            throw new IllegalArgumentException("New password is required");
        }

        if (request.getNewPassword().length() < 6) {
            throw new IllegalArgumentException("New password must be at least 6 characters");
        }

        User user = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new IllegalArgumentException("Email is not registered"));

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));

        userRepository.save(user);

        return "Password changed successfully. Please login with your new password.";
    }




}