package com.project.filemanagement.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.project.filemanagement.dto.AdminResetPasswordResponse;
import com.project.filemanagement.dto.LoginRequest;
import com.project.filemanagement.dto.LoginResponse;
import com.project.filemanagement.dto.RegisterRequest;
import com.project.filemanagement.entity.RoleEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserRoleEntity;
import com.project.filemanagement.entity.UserRoleId;
import com.project.filemanagement.entity.UserStatus;
import com.project.filemanagement.repository.RoleRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.repository.UserRoleRepository;
import com.project.filemanagement.security.JwtUtil;


@Service
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            EmailService emailService,
            AuditLogService auditLogService,
            UserRoleRepository userRoleRepository,
            RoleRepository roleRepository
            ) 
    {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
        this.userRoleRepository = userRoleRepository;
        this.roleRepository = roleRepository;
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

user = userRepository.save(user);

RoleEntity defaultRole = roleRepository
        .findByName("USER")
        .orElseThrow(() ->
                new RuntimeException("Default USER role not found"));

UserRoleEntity userRole = UserRoleEntity.builder()
        .id(new UserRoleId(
                user.getId(),
                defaultRole.getId()
        ))
        .user(user)
        .role(defaultRole)
        .build();

userRoleRepository.save(userRole);

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
                user.getPasswordHash());

        if (!passwordMatched) {
            return new LoginResponse("Invalid email or password", null, null, null);
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            return new LoginResponse(
                    "Your account has been blocked. Contact administrator.",
                    null,
                    null,
                    null);
        }

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getFullName());

        return new LoginResponse(
                "Login successful",
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                token,
                getPrimaryRole(user)
            );
    }

public String forgotPassword(String email) {

    User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

    if (user.getOtp() != null &&
            user.getOtpExpiry() != null &&
            user.getOtpExpiry().isAfter(LocalDateTime.now())) {

        return "OTP already sent. Check your email.";
    }

    String otp = String.format("%06d",
            new Random().nextInt(1000000));

    user.setOtp(otp);

    user.setOtpExpiry(
            LocalDateTime.now().plusMinutes(5));

    userRepository.save(user);

    emailService.sendOtpEmail(
            user.getEmail(),
            otp);

    return "OTP sent successfully.";
}

public String resetPassword(String otp, String newPassword) {

    User user = userRepository.findByOtp(otp)
            .orElseThrow(() -> new RuntimeException("Invalid OTP"));

    if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
        throw new RuntimeException("OTP expired");
    }

    user.setPasswordHash(
            passwordEncoder.encode(newPassword));

    user.setOtp(null);
    user.setOtpExpiry(null);

    userRepository.save(user);

    return "Password reset successful";
}

    public AdminResetPasswordResponse adminResetPassword(
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String temporaryPassword = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .substring(0, 10);

        user.setPasswordHash(
                passwordEncoder.encode(temporaryPassword));

        userRepository.save(user);

        auditLogService.logAction(
                "PASSWORD_RESET",
                "ADMIN",
                "Reset password for " + user.getEmail());

        return new AdminResetPasswordResponse(
                user.getEmail(),
                temporaryPassword);
    }

    private String getPrimaryRole(User user) {

    return userRoleRepository.findByUser(user)
            .stream()
            .findFirst()
            .map(userRole ->
                    userRole.getRole().getName())
            .orElse("NO_ROLE");
}
}