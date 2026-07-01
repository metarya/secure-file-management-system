package com.project.filemanagement.service;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.filemanagement.dto.AdminFileResponse;
import com.project.filemanagement.dto.AdminFileStatsResponse;
import com.project.filemanagement.dto.AdminStatsResponse;
import com.project.filemanagement.dto.AdminSystemHealthResponse;
import com.project.filemanagement.dto.AdminUserActivityResponse;
import com.project.filemanagement.dto.AdminUserFileSummaryResponse;
import com.project.filemanagement.dto.AdminUserResponse;
import com.project.filemanagement.dto.PageResponse;
import com.project.filemanagement.dto.UpdateRoleRequest;
import com.project.filemanagement.dto.UpdateUserStatusRequest;
import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.RoleEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserRoleEntity;
import com.project.filemanagement.entity.UserRoleId;
import com.project.filemanagement.entity.UserStatus;
import com.project.filemanagement.exception.ResourceNotFoundException;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.RoleRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.repository.UserRoleRepository;
import com.project.filemanagement.util.PageRequests;

@Service
public class AdminService {

    private static final Map<String, String> USER_SORT_FIELDS = Map.of(
            "fullName", "fullName",
            "email", "email",
            "status", "status",
            "createdAt", "createdAt"
    );
    private static final String DEFAULT_USER_SORT = "createdAt";

    private static final Map<String, String> FILE_SORT_FIELDS = Map.of(
            "fileName", "fileName",
            "uploadedAt", "uploadedAt",
            "fileSize", "fileSize",
            "fileType", "fileType",
            "ownerName", "owner.fullName"
    );
    private static final String DEFAULT_FILE_SORT = "uploadedAt";

    private static final Map<String, String> ACTIVITY_SORT_FIELDS = Map.of(
            "fullName", "u.fullName",
            "email", "u.email",
            "createdAt", "u.createdAt",
            "totalFiles", "COUNT(f.id)",
            "storageUsed", "SUM(f.fileSize)",
            "latestUpload", "MAX(f.uploadedAt)"
    );
    private static final String DEFAULT_ACTIVITY_SORT = "createdAt";

    private final UserRepository userRepository;
    private final FileRepository fileRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuditLogService auditLogService;
    private final ActivityLogService activityLogService;

    public AdminService(
            UserRepository userRepository,
            FileRepository fileRepository,
            RoleRepository roleRepository,
            UserRoleRepository userRoleRepository,
            AuditLogService auditLogService,
            ActivityLogService activityLogService
    ) {
        this.userRepository = userRepository;
        this.fileRepository = fileRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.auditLogService = auditLogService;
        this.activityLogService = activityLogService;
    }

    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long totalAdmins = userRepository.findAll()
                .stream()
                .filter(user -> "ADMIN".equalsIgnoreCase(getPrimaryRole(user)))
                .count();
        long totalRegularUsers = totalUsers - totalAdmins;
        return new AdminStatsResponse(totalUsers, totalAdmins, totalRegularUsers);
    }

    public PageResponse<AdminUserResponse> getAllUsers(
            int page, int size, String sort, String direction, String search) {

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

    public PageResponse<AdminFileResponse> getAllFiles(
            int page, int size, String sort, String direction, String search) {

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

    public AdminFileStatsResponse getFileStats() {
        List<FileEntity> files = fileRepository.findAll();
        long totalFiles = files.size();
        long publicFiles = files.stream()
                .filter(f -> "PUBLIC".equalsIgnoreCase(f.getVisibility()))
                .count();
        long privateFiles = files.stream()
                .filter(f -> "PRIVATE".equalsIgnoreCase(f.getVisibility()))
                .count();
        long totalStorageBytes = files.stream()
                .mapToLong(f -> f.getFileSize() == null ? 0 : f.getFileSize())
                .sum();
        double totalStorageMB = totalStorageBytes / (1024.0 * 1024.0);
        return new AdminFileStatsResponse(
                totalFiles, publicFiles, privateFiles, totalStorageBytes, totalStorageMB);
    }

    public List<AdminUserFileSummaryResponse> getUserFileSummary() {
        return userRepository.findAll()
                .stream()
                .map(user -> {
                    List<FileEntity> userFiles = fileRepository.findByOwner(user);
                    long totalFiles = userFiles.size();
                    long totalStorageBytes = userFiles.stream()
                            .mapToLong(f -> f.getFileSize() == null ? 0 : f.getFileSize())
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

    public PageResponse<AdminUserActivityResponse> getUserActivity(
            int page, int size, String sort, String direction, String search) {

        Pageable pageable = PageRequests.ofUnsafe(
                page, size, sort, direction, ACTIVITY_SORT_FIELDS, DEFAULT_ACTIVITY_SORT, "u.id");
        String term = (search == null || search.isBlank()) ? null : search.trim();
        return PageResponse.of(userRepository.findUserActivity(term, pageable));
    }

    public AdminSystemHealthResponse getSystemHealth() {
        long totalUsers = userRepository.count();
        long activeUsers = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.ACTIVE)
                .count();
        long blockedUsers = userRepository.findAll().stream()
                .filter(u -> u.getStatus() == UserStatus.BLOCKED)
                .count();
        List<FileEntity> files = fileRepository.findAll();
        long totalFiles = files.size();
        long totalStorageBytes = files.stream()
                .mapToLong(f -> f.getFileSize() == null ? 0 : f.getFileSize())
                .sum();
        return new AdminSystemHealthResponse(
                totalUsers, activeUsers, blockedUsers, totalFiles, totalStorageBytes);
    }

    @Transactional
    public String updateUserRole(Long userId, UpdateRoleRequest request, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        String oldRole = "UNKNOWN";

        RoleEntity newRole = roleRepository.findByName(request.getRole().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Role not found"));

        userRoleRepository.deleteByUser(user);
        userRoleRepository.flush();

        UserRoleEntity userRole = UserRoleEntity.builder()
                .id(new UserRoleId(user.getId(), newRole.getId()))
                .user(user)
                .role(newRole)
                .build();

        userRoleRepository.save(userRole);

        auditLogService.logAction(
                "ROLE_CHANGED",
                "ADMIN",
                "Changed user " + user.getEmail() + " role " + oldRole + " -> " + newRole.getName()
        );

        activityLogService.logByEmail(
                adminEmail,
                "ROLE_CHANGED",
                ActivityLogService.RESOURCE_USER,
                user.getId(),
                user.getEmail(),
                ActivityLogService.SUCCESS,
                null,
                null,
                "Changed role of " + user.getEmail() + " from " + oldRole + " to " + newRole.getName()
        );

        return "Role updated successfully";
    }

    public String updateUserStatus(Long userId, UpdateUserStatusRequest request, String adminEmail) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        UserStatus oldStatus = user.getStatus();
        UserStatus newStatus = UserStatus.valueOf(request.getStatus().toUpperCase());

        user.setStatus(newStatus);
        userRepository.save(user);

        auditLogService.logAction(
                "USER_STATUS_CHANGED",
                "ADMIN",
                "Changed user " + user.getEmail() + " status " + oldStatus.name() + " -> " + newStatus.name()
        );

        String statusAction = newStatus == UserStatus.BLOCKED ? "USER_DISABLED" : "USER_ENABLED";

        activityLogService.logByEmail(
                adminEmail,
                statusAction,
                ActivityLogService.RESOURCE_USER,
                user.getId(),
                user.getEmail(),
                ActivityLogService.SUCCESS,
                null,
                null,
                "Changed status of " + user.getEmail() + " from " + oldStatus.name() + " to " + newStatus.name()
        );

        return "User status updated successfully";
    }

    public String getPrimaryRole(User user) {
        return userRoleRepository.findByUser(user)
                .stream()
                .findFirst()
                .map(ur -> ur.getRole().getName())
                .orElse("NO_ROLE");
    }
}
