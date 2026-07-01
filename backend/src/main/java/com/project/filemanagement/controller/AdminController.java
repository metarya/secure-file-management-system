package com.project.filemanagement.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
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
import com.project.filemanagement.dto.AdminUserStorageResponse;
import com.project.filemanagement.dto.AuditLogResponse;
import com.project.filemanagement.dto.PageResponse;
import com.project.filemanagement.dto.UpdateRoleRequest;
import com.project.filemanagement.dto.UpdateUserStatusRequest;
import com.project.filemanagement.service.AdminService;
import com.project.filemanagement.service.AuthService;
import com.project.filemanagement.service.FileService;
import com.project.filemanagement.service.UserService;
import com.project.filemanagement.service.UserStorageSettingsService;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.service.AuditLogService;
import org.springframework.data.domain.Pageable;
import com.project.filemanagement.util.PageRequests;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final Map<String, String> AUDIT_SORT_FIELDS = Map.of(
            "createdAt", "createdAt",
            "action", "action",
            "performedBy", "performedBy"
    );
    private static final String DEFAULT_AUDIT_SORT = "createdAt";

    private final AdminService adminService;
    private final FileService fileService;
    private final AuthService authService;
    private final AuditLogService auditLogService;
    private final UserService userService;
    private final UserStorageSettingsService userStorageSettingsService;
    private final UserRepository userRepository;

    public AdminController(
            AdminService adminService,
            FileService fileService,
            AuthService authService,
            AuditLogService auditLogService,
            UserService userService,
            UserStorageSettingsService userStorageSettingsService,
            UserRepository userRepository
    ) {
        this.adminService = adminService;
        this.fileService = fileService;
        this.authService = authService;
        this.auditLogService = auditLogService;
        this.userService = userService;
        this.userStorageSettingsService = userStorageSettingsService;
        this.userRepository = userRepository;
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/user-storage")
    public List<AdminUserStorageResponse> getUserStorage() {
        return userStorageSettingsService.adminListUserStorage(userRepository.findAll());
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/test")
    public String test() {
        return "Admin access granted";
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        return adminService.getStats();
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/users")
    public PageResponse<AdminUserResponse> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search
    ) {
        return adminService.getAllUsers(page, size, sort, direction, search);
    }

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/files")
    public PageResponse<AdminFileResponse> getAllFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "uploadedAt") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search
    ) {
        return adminService.getAllFiles(page, size, sort, direction, search);
    }

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/files/{fileId}/preview")
    public AdminFilePreviewResponse previewFile(@PathVariable Long fileId) {
        return fileService.adminPreviewFile(fileId);
    }

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<byte[]> adminDownloadFile(@PathVariable Long fileId) {
        return fileService.adminDownloadFile(fileId);
    }

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/files/{fileId}/stream")
    public ResponseEntity<byte[]> adminStreamFile(@PathVariable Long fileId) {
        return fileService.adminDownloadFile(fileId);
    }

    @PreAuthorize("hasAuthority('FILE:DELETE_ANY')")
    @DeleteMapping("/files/{fileId}")
    public String deleteFile(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        return fileService.adminDeleteFile(
                fileId, authentication == null ? null : authentication.getName());
    }

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/file-stats")
    public AdminFileStatsResponse getFileStats() {
        return adminService.getFileStats();
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/user-file-summary")
    public List<AdminUserFileSummaryResponse> getUserFileSummary() {
        return adminService.getUserFileSummary();
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/user-activity")
    public PageResponse<AdminUserActivityResponse> getUserActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search
    ) {
        return adminService.getUserActivity(page, size, sort, direction, search);
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/system-health")
    public AdminSystemHealthResponse getSystemHealth() {
        return adminService.getSystemHealth();
    }

    @PreAuthorize("hasAuthority('USER:RESET_PASSWORD')")
    @PostMapping("/users/reset-password")
    public AdminResetPasswordResponse resetUserPassword(@RequestParam String email) {
        return authService.adminResetPassword(email);
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/audit-logs")
    public PageResponse<AuditLogResponse> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = DEFAULT_AUDIT_SORT) String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequests.of(
                page, size, sort, direction, AUDIT_SORT_FIELDS, DEFAULT_AUDIT_SORT);
        return auditLogService.getLogsPage(search, pageable);
    }

    @PreAuthorize("hasAuthority('USER:ROLE_ASSIGN')")
    @PatchMapping("/users/{id}/role")
    public String updateUserRole(
            @PathVariable Long id,
            @RequestBody UpdateRoleRequest request,
            Authentication authentication
    ) {
        return adminService.updateUserRole(
                id, request, authentication == null ? null : authentication.getName());
    }

    @PreAuthorize("hasAuthority('USER:DISABLE')")
    @PatchMapping("/users/{id}/status")
    public String updateUserStatus(
            @PathVariable Long id,
            @RequestBody UpdateUserStatusRequest request,
            Authentication authentication
    ) {
        return adminService.updateUserStatus(
                id, request, authentication == null ? null : authentication.getName());
    }

    @PreAuthorize("hasAuthority('FILE:RESTORE')")
    @PatchMapping("/files/{fileId}/restore")
    public String restoreFile(
            @PathVariable Long fileId,
            Authentication authentication
    ) {
        return fileService.restoreFile(
                fileId, authentication == null ? null : authentication.getName());
    }

    @PreAuthorize("hasAuthority('USER:DELETE')")
    @DeleteMapping("/users/{userId}")
    public String deleteUser(
            @PathVariable Long userId,
            Authentication authentication
    ) {
        return userService.deleteUser(userId, authentication.getName());
    }
}
