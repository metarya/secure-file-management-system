package com.project.filemanagement.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.dto.AdminFilePreviewResponse;
import com.project.filemanagement.dto.AdminFileResponse;
import com.project.filemanagement.dto.AdminFileStatsResponse;
import com.project.filemanagement.dto.AdminResetPasswordResponse;
import com.project.filemanagement.dto.AdminStatsResponse;
import com.project.filemanagement.dto.AdminSystemHealthResponse;
import com.project.filemanagement.dto.AdminUserActivityResponse;
import com.project.filemanagement.dto.AdminUserFileSummaryResponse;
import com.project.filemanagement.dto.AdminUserResponse;
import com.project.filemanagement.dto.AuditLogResponse;
import com.project.filemanagement.dto.UpdateRoleRequest;
import com.project.filemanagement.dto.UpdateUserStatusRequest;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.RoleEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserRoleEntity;
import com.project.filemanagement.entity.UserRoleId;
import com.project.filemanagement.entity.UserStatus;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.RoleRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.repository.UserRoleRepository;
import com.project.filemanagement.service.AuditLogService;
import com.project.filemanagement.service.AuthService;
import com.project.filemanagement.service.FileService;
import com.project.filemanagement.service.UserService;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final FileService fileService;
    private final AuthService authService;
    private final AuditLogService auditLogService;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserService userService;

    public AdminController(
            UserRepository userRepository,
            FileRepository fileRepository,
            FileService fileService,
            AuthService authService,
            AuditLogService auditLogService,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            UserService userService
    ) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.fileService = fileService;
        this.authService = authService;
        this.auditLogService = auditLogService;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.userService = userService;
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/test")
    public String test() {
        return "Admin access granted";
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/stats")
    public AdminStatsResponse getStats() {

        long totalUsers = userRepository.count();

        long totalAdmins = userRepository.findAll()
                .stream()
                .filter(user ->  "ADMIN".equalsIgnoreCase(getPrimaryRole(user)))
                .count();

        long totalRegularUsers = totalUsers - totalAdmins;

        return new AdminStatsResponse(
                totalUsers,
                totalAdmins,
                totalRegularUsers
        );
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/users")
    public List<AdminUserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(user -> new AdminUserResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        getPrimaryRole(user),
                        user.getStatus().name(),
                        user.getCreatedAt()
                ))
                .toList();
    }

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/files")
    public List<AdminFileResponse> getAllFiles() {

        return fileRepository.findAll()
                .stream()
                .map(file -> new AdminFileResponse(
                        file.getId(),
                        file.getFileName(),
                        file.getDescription(),
                        file.getFileSize(),
                        file.getVisibility(),
                        file.getUploadedAt(),
                        file.getOwner().getId(),
                        file.getOwner().getFullName(),
                        file.getOwner().getEmail()
                ))
                .toList();
    }

    @GetMapping("/files/{fileId}/preview")
    public AdminFilePreviewResponse previewFile(
            @PathVariable Long fileId
    ) {
        return fileService.adminPreviewFile(fileId);
    }

    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<byte[]> adminDownloadFile(
            @PathVariable Long fileId
    ) {
        return fileService.adminDownloadFile(fileId);
    }

    @GetMapping("/files/{fileId}/stream")
public ResponseEntity<byte[]> adminStreamFile(
        @PathVariable Long fileId
) {
    return fileService.adminDownloadFile(fileId);
}

    @PreAuthorize("hasAuthority('FILE:DELETE_ANY')")
    @DeleteMapping("/files/{fileId}")
public String deleteFile(
        @PathVariable Long fileId
) {
    return fileService.adminDeleteFile(fileId);
}

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/file-stats")
    public AdminFileStatsResponse getFileStats() {

        List<FileEntity> files = fileRepository.findAll();

        long totalFiles = files.size();

        long publicFiles = files.stream()
                .filter(file -> "PUBLIC".equalsIgnoreCase(file.getVisibility()))
                .count();

        long privateFiles = files.stream()
                .filter(file -> "PRIVATE".equalsIgnoreCase(file.getVisibility()))
                .count();

        long totalStorageBytes = files.stream()
                .mapToLong(file ->
                        file.getFileSize() == null
                                ? 0
                                : file.getFileSize())
                .sum();

        double totalStorageMB =
                totalStorageBytes / (1024.0 * 1024.0);

        return new AdminFileStatsResponse(
                totalFiles,
                publicFiles,
                privateFiles,
                totalStorageBytes,
                totalStorageMB
        );
    }

    
    @GetMapping("/user-file-summary")
    public List<AdminUserFileSummaryResponse> getUserFileSummary() {

        return userRepository.findAll()
                .stream()
                .map(user -> {

                    List<FileEntity> userFiles =
                            fileRepository.findByOwner(user);

                    long totalFiles = userFiles.size();

                    long totalStorageBytes = userFiles.stream()
                            .mapToLong(file ->
                                    file.getFileSize() == null
                                            ? 0
                                            : file.getFileSize())
                            .sum();

                    return new AdminUserFileSummaryResponse(
                            user.getId(),
                            user.getFullName(),
                            user.getEmail(),
                            totalFiles,
                            totalStorageBytes
                    );
                })
                .toList();
    }

    @GetMapping("/user-activity")
    public List<AdminUserActivityResponse> getUserActivity() {

        return userRepository.findAll()
                .stream()
                .map(user -> {

                    List<FileEntity> userFiles =
                            fileRepository.findByOwner(user);

                    long totalFiles = userFiles.size();

                    long storageUsedBytes = userFiles.stream()
                            .mapToLong(file ->
                                    file.getFileSize() == null
                                            ? 0
                                            : file.getFileSize())
                            .sum();

                    java.time.LocalDateTime lastUploadDate =
                            userFiles.stream()
                                    .map(FileEntity::getUploadedAt)
                                    .max(java.time.LocalDateTime::compareTo)
                                    .orElse(null);

                    return new AdminUserActivityResponse(
                            user.getId(),
                            user.getFullName(),
                            user.getEmail(),
                            totalFiles,
                            storageUsedBytes,
                            lastUploadDate
                    );
                })
                .toList();
    }

    @GetMapping("/system-health")
public AdminSystemHealthResponse getSystemHealth() {

    long totalUsers = userRepository.count();

    long activeUsers = userRepository.findAll()
            .stream()
            .filter(user ->
                    user.getStatus() == UserStatus.ACTIVE)
            .count();

    long blockedUsers = userRepository.findAll()
            .stream()
            .filter(user ->
                    user.getStatus() == UserStatus.BLOCKED)
            .count();

    List<FileEntity> files = fileRepository.findAll();

    long totalFiles = files.size();

    long totalStorageBytes = files.stream()
            .mapToLong(file ->
                    file.getFileSize() == null
                            ? 0
                            : file.getFileSize())
            .sum();

    return new AdminSystemHealthResponse(
            totalUsers,
            activeUsers,
            blockedUsers,
            totalFiles,
            totalStorageBytes
    );
}

@PreAuthorize("hasAuthority('USER:RESET_PASSWORD')")
@PostMapping("/users/reset-password")
public AdminResetPasswordResponse resetUserPassword(
        @RequestParam String email
) {
    return authService.adminResetPassword(email);
}

@GetMapping("/audit-logs")
public List<AuditLogResponse> getAuditLogs() {
    return auditLogService.getAllLogs();
}

@PreAuthorize("hasAuthority('USER:ROLE_ASSIGN')")
@PatchMapping("/users/{id}/role")
@Transactional
public String updateUserRole(
        @PathVariable Long id,
        @RequestBody UpdateRoleRequest request
) {

User user = userRepository.findById(id)
        .orElseThrow(() ->
                new RuntimeException("User not found"));

String oldRole = "UNKNOWN";

RoleEntity newRole = roleRepository
        .findByName(request.getRole().toUpperCase())
        .orElseThrow(() ->
                new RuntimeException("Role not found"));

userRoleRepository.deleteByUser(user);
userRoleRepository.flush();

UserRoleEntity userRole = UserRoleEntity.builder()
        .id(new UserRoleId(
                user.getId(),
                newRole.getId()
        ))
        .user(user)
        .role(newRole)
        .build();

userRoleRepository.save(userRole);

auditLogService.logAction(
        "ROLE_CHANGED",
        "ADMIN",
        "Changed user "
                + user.getEmail()
                + " role "
                + oldRole
                + " -> "
                + newRole.getName()
);

    return "Role updated successfully";
}

@PreAuthorize("hasAuthority('USER:DISABLE')")
@PatchMapping("/users/{id}/status")
public String updateUserStatus(
        @PathVariable Long id,
        @RequestBody UpdateUserStatusRequest request
) {

    User user = userRepository.findById(id)
            .orElseThrow(() ->
                    new RuntimeException("User not found"));

    UserStatus oldStatus = user.getStatus();

    UserStatus newStatus = UserStatus.valueOf(
            request.getStatus().toUpperCase()
    );

    user.setStatus(newStatus);

    userRepository.save(user);

    auditLogService.logAction(
            "USER_STATUS_CHANGED",
            "ADMIN",
            "Changed user "
                    + user.getEmail()
                    + " status "
                    + oldStatus.name()
                    + " -> "
                    + newStatus.name()
    );

    return "User status updated successfully";
}

@PreAuthorize("hasAuthority('FILE:RESTORE')")
@PatchMapping("/files/{fileId}/restore")
public String restoreFile(
        @PathVariable Long fileId
) {
    return fileService.restoreFile(fileId);
}

@PreAuthorize("hasAuthority('USER:DELETE')")
@DeleteMapping("/users/{userId}")
public String deleteUser(
        @PathVariable Long userId,
        Authentication authentication
) {
    return userService.deleteUser(userId, authentication.getName());
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