package com.project.filemanagement.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.dto.PermissionResponse;
import com.project.filemanagement.dto.UpdateUserPermissionsRequest;
import com.project.filemanagement.dto.UserPermissionsResponse;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.service.AuditLogService;
import com.project.filemanagement.service.RbacService;

/**
 * Admin endpoints for managing the permissions granted directly to an
 * individual user (separate from their role). Gated by the same authority as
 * role assignment, so any admin who can change roles can change permissions.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminPermissionController {

    private final UserRepository userRepository;
    private final RbacService rbacService;
    private final AuditLogService auditLogService;

    public AdminPermissionController(
            UserRepository userRepository,
            RbacService rbacService,
            AuditLogService auditLogService
    ) {
        this.userRepository = userRepository;
        this.rbacService = rbacService;
        this.auditLogService = auditLogService;
    }

    // The full catalog of permissions that exist in the system, so the UI can
    // render every toggle (granted or not).
    @PreAuthorize("hasAuthority('USER:ROLE_ASSIGN')")
    @GetMapping("/permissions")
    public List<PermissionResponse> getPermissionCatalog() {
        return rbacService.getAllPermissions()
                .stream()
                .map(permission -> new PermissionResponse(
                        permission.getCode(),
                        permission.getDescription()))
                .toList();
    }

    // A single user's permissions, split into role-inherited vs. directly granted.
    @PreAuthorize("hasAuthority('USER:ROLE_ASSIGN')")
    @GetMapping("/users/{id}/permissions")
    public UserPermissionsResponse getUserPermissions(
            @PathVariable Long id
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return new UserPermissionsResponse(
                user.getId(),
                rbacService.getRolePermissionCodesForUser(user),
                rbacService.getDirectPermissionCodesForUser(user),
                rbacService.getPermissionCodesForUser(user));
    }

    // Replace a user's direct permission grants with exactly the codes provided.
    @PreAuthorize("hasAuthority('USER:ROLE_ASSIGN')")
    @PutMapping("/users/{id}/permissions")
    public String updateUserPermissions(
            @PathVariable Long id,
            @RequestBody UpdateUserPermissionsRequest request
    ) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        rbacService.setDirectPermissions(user, request.getPermissions());

        auditLogService.logAction(
                "PERMISSIONS_UPDATED",
                "ADMIN",
                "Updated direct permissions for "
                        + user.getEmail()
                        + " -> "
                        + (request.getPermissions() == null
                                ? "[]"
                                : request.getPermissions().toString()));

        return "Permissions updated successfully";
    }
}
