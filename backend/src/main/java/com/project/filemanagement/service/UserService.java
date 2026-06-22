package com.project.filemanagement.service;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.FilePermissionRepository;
import com.project.filemanagement.repository.FileRepository;
import com.project.filemanagement.repository.UserPermissionRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.repository.UserRoleRepository;

/**
 * User-lifecycle operations that go beyond a single repository call.
 *
 * <p>Deleting a user is a hard delete: the {@code users} row is removed. Because
 * {@code files.owner_id} is NOT NULL with a foreign key to {@code users}, the
 * user's files cannot be kept as soft-deleted while the owner disappears — so
 * the cascade removes the user's files (and their shares) along with the
 * account. The two safety guards (no self-delete, never remove the last admin)
 * run before anything is touched.
 */
@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final FilePermissionRepository filePermissionRepository;
    private final FileRepository fileRepository;
    private final AuditLogService auditLogService;

    public UserService(
            UserRepository userRepository,
            UserRoleRepository userRoleRepository,
            UserPermissionRepository userPermissionRepository,
            FilePermissionRepository filePermissionRepository,
            FileRepository fileRepository,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.userRoleRepository = userRoleRepository;
        this.userPermissionRepository = userPermissionRepository;
        this.filePermissionRepository = filePermissionRepository;
        this.fileRepository = fileRepository;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public String deleteUser(Long userId, String actingAdminEmail) {

        if (userId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User ID is required");
        }

        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        // Guard 1: an admin cannot delete their own account.
        if (actingAdminEmail != null && actingAdminEmail.equalsIgnoreCase(target.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot delete your own account");
        }

        // Guard 2: never remove the last remaining administrator.
        if (isAdmin(target) && countAdmins() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete the last administrator");
        }

        // 1. Revoke shares granted TO this user (their access to others' files).
        filePermissionRepository.deleteAllBySharedWithUser(target);

        // 2. Revoke shares ON this user's files, then hard-delete those files.
        List<FileEntity> ownedFiles = fileRepository.findByOwner(target);
        for (FileEntity file : ownedFiles) {
            filePermissionRepository.deleteAllByFile(file);
        }
        fileRepository.deleteAll(ownedFiles);
        fileRepository.flush();

        // 3. Remove role assignments and directly-granted permissions.
        userRoleRepository.deleteByUser(target);
        userPermissionRepository.deleteByUser(target);
        userRoleRepository.flush();
        userPermissionRepository.flush();

        // 4. Finally remove the account itself.
        String deletedEmail = target.getEmail();
        userRepository.delete(target);
        userRepository.flush();

        auditLogService.logAction(
                "USER_DELETED",
                actingAdminEmail == null ? "ADMIN" : actingAdminEmail,
                "Deleted user " + deletedEmail
                        + " (removed " + ownedFiles.size()
                        + " file(s), all shares and permissions)"
        );

        return "User deleted successfully";
    }

    private boolean isAdmin(User user) {
        return userRoleRepository.findByUser(user).stream()
                .anyMatch(userRole -> "ADMIN".equalsIgnoreCase(userRole.getRole().getName()));
    }

    private long countAdmins() {
        return userRepository.findAll().stream()
                .filter(this::isAdmin)
                .count();
    }
}
