package com.project.filemanagement.service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;
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
import com.project.filemanagement.exception.BadRequestException;
import com.project.filemanagement.exception.ResourceNotFoundException;
import com.project.filemanagement.repository.RoleRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.repository.UserRoleRepository;
import com.project.filemanagement.security.JwtUtil;


@Service
public class AuthService {

    // Cryptographically secure RNG for OTP generation (reused across calls).
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    private static final int ACCOUNT_LOCK_DURATION_MINUTES = 15;

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditLogService auditLogService;
    private final ActivityLogService activityLogService;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;

    public AuthService(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            EmailService emailService,
            AuditLogService auditLogService,
            ActivityLogService activityLogService,
            UserRoleRepository userRoleRepository,
            RoleRepository roleRepository
            )
    {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
        this.activityLogService = activityLogService;
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

activityLogService.log(
        user,
        "USER_CREATED",
        ActivityLogService.RESOURCE_USER,
        user.getId(),
        user.getEmail(),
        ActivityLogService.SUCCESS,
        null,
        null,
        "New account registered: " + user.getEmail());

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
            activityLogService.logByEmail(
                    request.getEmail(),
                    "LOGIN_FAILED",
                    ActivityLogService.RESOURCE_AUTH,
                    null,
                    request.getEmail(),
                    ActivityLogService.FAILURE,
                    null,
                    null,
                    "Login failed: no account for this email");
            return new LoginResponse("Invalid email or password", null, null, null);
        }

        User user = userOptional.get();

        if (user.isAccountLocked()) {
                activityLogService.log(
                        user,
                        "LOGIN_BLOCKED",
                        ActivityLogService.RESOURCE_AUTH,
                        user.getId(),
                        user.getEmail(),
                        ActivityLogService.FAILURE,
                        null,
                        null,
                        "Login blocked: account temporarily locked");

                return new LoginResponse(
                        "Your account is temporarily locked. Please try again later.",
                        null,
                        null,
                        null
                );

        }

        // Lock timestamp exists but has already expired — clear stale data immediately.
        if (user.getAccountLockedUntil() != null) {
            user.resetFailedLoginAttempts();
            userRepository.save(user);
        }

        boolean passwordMatched = passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash());

        if (!passwordMatched) {
                user.incrementFailedLoginAttempts();
                if (user.getFailedLoginAttempts() >= MAX_FAILED_LOGIN_ATTEMPTS) {
                    user.setAccountLockedUntil(
                            LocalDateTime.now().plusMinutes(ACCOUNT_LOCK_DURATION_MINUTES));
                    activityLogService.log(
                            user,
                            "ACCOUNT_LOCKED",
                            ActivityLogService.RESOURCE_AUTH,
                            user.getId(),
                            user.getEmail(),
                            ActivityLogService.FAILURE,
                            null,
                            null,
                            "Account locked after too many failed login attempts");
                }
                userRepository.save(user);
            activityLogService.log(
                    user,
                    "LOGIN_FAILED",
                    ActivityLogService.RESOURCE_AUTH,
                    user.getId(),
                    user.getEmail(),
                    ActivityLogService.FAILURE,
                    null,
                    null,
                    "Login failed: incorrect password");
            return new LoginResponse("Invalid email or password", null, null, null);
        }

        if (user.getStatus() == UserStatus.BLOCKED) {
            activityLogService.log(
                    user,
                    "LOGIN_FAILED",
                    ActivityLogService.RESOURCE_AUTH,
                    user.getId(),
                    user.getEmail(),
                    ActivityLogService.FAILURE,
                    null,
                    null,
                    "Login blocked: account is disabled");
            return new LoginResponse(
                    "Your account has been blocked. Contact administrator.",
                    null,
                    null,
                    null);
        }


        user.resetFailedLoginAttempts();
        userRepository.save(user);

        String token = jwtUtil.generateToken(
                user.getEmail(),
                user.getFullName());

        activityLogService.log(
                user,
                "LOGIN",
                ActivityLogService.RESOURCE_AUTH,
                user.getId(),
                user.getEmail(),
                ActivityLogService.SUCCESS,
                null,
                null,
                "User signed in");

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
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    if (user.getOtp() != null &&
            user.getOtpExpiry() != null &&
            user.getOtpExpiry().isAfter(LocalDateTime.now())) {

        return "OTP already sent. Check your email.";
    }

    String otp = String.format("%06d",
            SECURE_RANDOM.nextInt(1000000));

    user.setOtp(otp);

    user.setOtpExpiry(
            LocalDateTime.now().plusMinutes(5));

    userRepository.save(user);

    emailService.sendOtpEmail(
            user.getEmail(),
            otp);

    return "OTP sent successfully.";
}

public String resetPassword(String email, String otp, String newPassword) {

    if (email == null || email.isBlank()) {
        throw new BadRequestException("Invalid OTP");
    }

    if (otp == null || otp.isBlank()) {
        throw new BadRequestException("Invalid OTP");
    }

    // Bind the OTP to the intended account: look up by email AND OTP together,
    // never by OTP alone, so a code can only reset the user it was issued to.
    User user = userRepository.findByEmailAndOtp(email.trim(), otp)
            .orElseThrow(() -> new BadRequestException("Invalid OTP"));

    // A missing expiry means there is no valid pending OTP — treat it the same
    // as an expired one rather than dereferencing null.
    if (user.getOtpExpiry() == null
            || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
        throw new BadRequestException("OTP expired");
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
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

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

        activityLogService.log(
                user,
                "PASSWORD_RESET",
                ActivityLogService.RESOURCE_USER,
                user.getId(),
                user.getEmail(),
                ActivityLogService.SUCCESS,
                null,
                null,
                "Administrator reset password for " + user.getEmail());

        return new AdminResetPasswordResponse(
                user.getEmail(),
                temporaryPassword);
    }

    /** Records an explicit sign-out for the authenticated user. */
    public void logout(String email) {
        if (email == null || email.isBlank()) {
            return;
        }
        userRepository.findByEmail(email).ifPresent(user ->
                activityLogService.log(
                        user,
                        "LOGOUT",
                        ActivityLogService.RESOURCE_AUTH,
                        user.getId(),
                        user.getEmail(),
                        ActivityLogService.SUCCESS,
                        null,
                        null,
                        "User signed out"));
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