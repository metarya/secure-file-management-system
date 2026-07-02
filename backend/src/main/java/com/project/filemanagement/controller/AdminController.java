package com.project.filemanagement.controller;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.dto.AdminFilePreviewResponse;
import com.project.filemanagement.dto.ChangeUserStorageProviderRequest;
import com.project.filemanagement.dto.AdminFileResponse;
import com.project.filemanagement.dto.AdminFileStatsResponse;
import com.project.filemanagement.dto.AdminResetPasswordResponse;
import com.project.filemanagement.dto.AdminStatsResponse;
import com.project.filemanagement.dto.AdminSystemHealthResponse;
import com.project.filemanagement.dto.AdminUserActivityResponse;
import com.project.filemanagement.dto.AdminUserFileSummaryResponse;
import com.project.filemanagement.dto.AdminUserResponse;
import com.project.filemanagement.dto.AuditLogResponse;
import com.project.filemanagement.dto.PageResponse;
import com.project.filemanagement.dto.UpdateRoleRequest;
import com.project.filemanagement.dto.UpdateUserStatusRequest;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.exception.ResourceNotFoundException;
import com.project.filemanagement.entity.RoleEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserRoleEntity;
import com.project.filemanagement.entity.UserRoleId;
import com.project.filemanagement.entity.UserStatus;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.RoleRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.repository.UserRoleRepository;
import com.project.filemanagement.dto.AdminUserStorageResponse;
import com.project.filemanagement.service.ActivityLogService;
import com.project.filemanagement.service.AuditLogService;
import com.project.filemanagement.service.AuthService;
import com.project.filemanagement.service.UserStorageSettingsService;
import com.project.filemanagement.service.FileService;
import com.project.filemanagement.service.UserService;
import com.project.filemanagement.util.PageRequests;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final FileService fileService;
    private final AuthService authService;
    private final AuditLogService auditLogService;
    private final ActivityLogService activityLogService;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserService userService;
    private final UserStorageSettingsService userStorageSettingsService;

    public AdminController(
            UserRepository userRepository,
            FileRepository fileRepository,
            FileService fileService,
            AuthService authService,
            AuditLogService auditLogService,
            ActivityLogService activityLogService,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            UserService userService,
            UserStorageSettingsService userStorageSettingsService
    ) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.fileService = fileService;
        this.authService = authService;
        this.auditLogService = auditLogService;
        this.activityLogService = activityLogService;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.userService = userService;
        this.userStorageSettingsService = userStorageSettingsService;
    }

    // Read-only: which storage provider each user uses. Administrators may VIEW
    // this but can never change another user's storage configuration.
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

    // Allowlist of admin-user sort options -> entity property paths. Role is a
    // join (user_roles) rather than a column, so it is intentionally not
    // sortable at the DB level and absent from this map.
    private static final Map<String, String> USER_SORT_FIELDS = Map.of(
            "fullName", "fullName",
            "email", "email",
            "status", "status",
            "createdAt", "createdAt"
    );

    private static final String DEFAULT_USER_SORT = "createdAt";

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/users")
    public PageResponse<AdminUserResponse> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = DEFAULT_USER_SORT) String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search
    ) {
        Pageable pageable = PageRequests.of(
                page, size, sort, direction, USER_SORT_FIELDS, DEFAULT_USER_SORT);

        Page<User> users = (search == null || search.isBlank())
                ? userRepository.findAll(pageable)
                : userRepository.findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        search.trim(), search.trim(), pageable);

        return PageResponse.of(users, user -> new AdminUserResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                getPrimaryRole(user),
                user.getStatus().name(),
                user.getCreatedAt()
        ));
    }

    // Allowlist of admin-file sort options: maps the public API field name to the
    // actual entity property path. Acts as the validation gate too — any field not
    // in this map falls back to the default, so arbitrary/unknown property names
    // can never reach Spring Data. "ownerName" deliberately maps to the nested
    // "owner.fullName" path so the API contract stays decoupled from the entity.
    private static final Map<String, String> FILE_SORT_FIELDS = Map.of(
            "fileName", "fileName",
            "uploadedAt", "uploadedAt",
            "fileSize", "fileSize",
            "fileType", "fileType",
            "ownerName", "owner.fullName"
    );

    private static final String DEFAULT_FILE_SORT = "uploadedAt";

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/files")
    public PageResponse<AdminFileResponse> getAllFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = DEFAULT_FILE_SORT) String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search
    ) {
        // PageRequests appends an `id` tiebreaker in the same direction, so rows
        // that tie on a second-precision `uploaded_at` still order stably and
        // actually reverse when the direction flips.
        Pageable pageable = PageRequests.of(
                page, size, sort, direction, FILE_SORT_FIELDS, DEFAULT_FILE_SORT);

        Page<FileEntity> files = (search == null || search.isBlank())
                ? fileRepository.findAll(pageable)
                : fileRepository
                    .findByFileNameContainingIgnoreCaseOrOwner_FullNameContainingIgnoreCaseOrOwner_EmailContainingIgnoreCase(
                            search.trim(), search.trim(), search.trim(), pageable);

        return PageResponse.of(files, file -> new AdminFileResponse(
                file.getId(),
                file.getFileName(),
                file.getDescription(),
                file.getFileSize(),
                file.getVisibility(),
                file.getUploadedAt(),
                file.getOwner().getId(),
                file.getOwner().getFullName(),
                file.getOwner().getEmail()
        ));
    }

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/files/{fileId}/preview")
    public AdminFilePreviewResponse previewFile(
            @PathVariable Long fileId
    ) {
        return fileService.adminPreviewFile(fileId);
    }

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<byte[]> adminDownloadFile(
            @PathVariable Long fileId
    ) {
        return fileService.adminDownloadFile(fileId);
    }

    @PreAuthorize("hasAuthority('FILE:VIEW_ANY')")
    @GetMapping("/files/{fileId}/stream")
public ResponseEntity<byte[]> adminStreamFile(
        @PathVariable Long fileId
) {
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

    
    @PreAuthorize("hasAuthority('USER:VIEW')")
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

    // Allowlist of admin-activity sort options -> raw JPQL ORDER BY expressions
    // used by the grouped aggregate query (UserRepository#findUserActivity).
    // User columns sort directly; "totalFiles"/"storageUsed"/"latestUpload" sort
    // by their aggregate so the DB orders BEFORE paginating. Aliases here are the
    // public API contract; "storageUsed"/"latestUpload" decouple the field name
    // from the underlying SUM/MAX expression.
    private static final Map<String, String> ACTIVITY_SORT_FIELDS = Map.of(
            "fullName", "u.fullName",
            "email", "u.email",
            "createdAt", "u.createdAt",
            "totalFiles", "COUNT(f.id)",
            "storageUsed", "SUM(f.fileSize)",
            "latestUpload", "MAX(f.uploadedAt)"
    );

    private static final String DEFAULT_ACTIVITY_SORT = "createdAt";

    @PreAuthorize("hasAuthority('USER:VIEW')")
    @GetMapping("/user-activity")
    public PageResponse<AdminUserActivityResponse> getUserActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = DEFAULT_ACTIVITY_SORT) String sort,
            @RequestParam(defaultValue = "desc") String direction,
            @RequestParam(required = false) String search
    ) {
        // The per-user file count / storage / last-upload are aggregates, so they
        // are computed in the DB by a grouped query that can ORDER BY the
        // aggregate and only then slice the page — letting "storageUsed" and
        // "latestUpload" be true server-side sorts. Aggregate columns need a raw
        // ORDER BY expression, hence ofUnsafe + the validated allowlist above.
        Pageable pageable = PageRequests.ofUnsafe(
                page, size, sort, direction, ACTIVITY_SORT_FIELDS, DEFAULT_ACTIVITY_SORT, "u.id");

        String term = (search == null || search.isBlank()) ? null : search.trim();

        return PageResponse.of(userRepository.findUserActivity(term, pageable));
    }

    @PreAuthorize("hasAuthority('USER:VIEW')")
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

    private static final Map<String, String> AUDIT_SORT_FIELDS = Map.of(
            "createdAt", "createdAt",
            "action", "action",
            "performedBy", "performedBy"
    );

    private static final String DEFAULT_AUDIT_SORT = "createdAt";

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
@Transactional
public String updateUserRole(
        @PathVariable Long id,
        @RequestBody UpdateRoleRequest request,
        Authentication authentication
) {

User user = userRepository.findById(id)
        .orElseThrow(() ->
                new ResourceNotFoundException("User not found"));

String oldRole = "UNKNOWN";

RoleEntity newRole = roleRepository
        .findByName(request.getRole().toUpperCase())
        .orElseThrow(() ->
                new ResourceNotFoundException("Role not found"));

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

activityLogService.logByEmail(
        authentication == null ? null : authentication.getName(),
        "ROLE_CHANGED",
        ActivityLogService.RESOURCE_USER,
        user.getId(),
        user.getEmail(),
        ActivityLogService.SUCCESS,
        null,
        null,
        "Changed role of " + user.getEmail()
                + " from " + oldRole + " to " + newRole.getName());

    return "Role updated successfully";
}

@PreAuthorize("hasAuthority('USER:DISABLE')")
@PatchMapping("/users/{id}/status")
public String updateUserStatus(
        @PathVariable Long id,
        @RequestBody UpdateUserStatusRequest request,
        Authentication authentication
) {

    User user = userRepository.findById(id)
            .orElseThrow(() ->
                    new ResourceNotFoundException("User not found"));

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

    // BLOCKED => account disabled, ACTIVE => account (re-)enabled.
    String statusAction = newStatus == UserStatus.BLOCKED ? "USER_DISABLED" : "USER_ENABLED";

    activityLogService.logByEmail(
            authentication == null ? null : authentication.getName(),
            statusAction,
            ActivityLogService.RESOURCE_USER,
            user.getId(),
            user.getEmail(),
            ActivityLogService.SUCCESS,
            null,
            null,
            "Changed status of " + user.getEmail()
                    + " from " + oldStatus.name() + " to " + newStatus.name());

    return "User status updated successfully";
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

@PreAuthorize("hasAuthority('USER:ROLE_ASSIGN')")
@PutMapping("/users/{id}/storage-provider")
public AdminUserStorageResponse changeUserStorageProvider(
        @PathVariable Long id,
        @RequestBody ChangeUserStorageProviderRequest request,
        Authentication authentication
) {
    User targetUser = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

    String adminEmail = authentication == null ? "ADMIN" : authentication.getName();

    String newProvider = userStorageSettingsService
            .adminChangeUserStorageProvider(targetUser, request.getStorageProvider(), adminEmail);

    auditLogService.logAction(
            "STORAGE_PROVIDER_CHANGED",
            adminEmail,
            "Changed storage provider for user " + targetUser.getEmail()
                    + " to " + newProvider
    );

    return new AdminUserStorageResponse(
            targetUser.getId(),
            targetUser.getFullName(),
            targetUser.getEmail(),
            newProvider
    );
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