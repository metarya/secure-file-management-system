package com.project.filemanagement.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.project.filemanagement.dto.AdminResetPasswordResponse;
import com.project.filemanagement.dto.LoginRequest;
import com.project.filemanagement.dto.LoginResponse;
import com.project.filemanagement.dto.RegisterRequest;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserStatus;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.security.JwtUtil;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            EmailService emailService,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
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

        if (user.getStatus() == UserStatus.BLOCKED) {
            return new LoginResponse(
                    "Your account has been blocked. Contact administrator.",
                    null,
                    null,
                    null
            );
        }

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getFullName(),
                user.getRole().name()
        );

        return new LoginResponse(
                "Login successful",
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                token,
                user.getRole().name()
        );
    }

    public String forgotPassword(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (
                user.getResetToken() != null &&
                user.getResetTokenExpiry() != null &&
                user.getResetTokenExpiry().isAfter(LocalDateTime.now())
        ) {

            return "Code already sent. Check your email.";
        }

        String token = UUID.randomUUID().toString();

        user.setResetToken(token);

        user.setResetTokenExpiry(
                LocalDateTime.now().plusMinutes(10)
        );

        userRepository.save(user);

        String resetLink = token;

        emailService.sendResetPasswordEmail(
                user.getEmail(),
                resetLink
        );

        return "Check your email for reset code.";
    }

    public String resetPassword(String token, String newPassword) {

        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Token expired");
        }

        user.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );

        user.setResetToken(null);

        user.setResetTokenExpiry(null);

        userRepository.save(user);

        return "Password reset successful";
    }


    public AdminResetPasswordResponse adminResetPassword(
        String email
    ) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() ->
                    new RuntimeException("User not found"));

    String temporaryPassword =
            UUID.randomUUID()
                    .toString()
                    .replace("-", "")
                    .substring(0, 10);

    user.setPasswordHash(
            passwordEncoder.encode(temporaryPassword)
    );

userRepository.save(user);

auditLogService.logAction(
        "PASSWORD_RESET",
        "ADMIN",
        "Reset password for " + user.getEmail()
);

return new AdminResetPasswordResponse(
        user.getEmail(),
        temporaryPassword
);
}
}