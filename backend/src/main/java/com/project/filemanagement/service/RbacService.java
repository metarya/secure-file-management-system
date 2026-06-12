package com.project.filemanagement.service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.project.filemanagement.entity.PermissionEntity;
import com.project.filemanagement.entity.RoleEntity;
import com.project.filemanagement.entity.RolePermissionEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserPermissionEntity;
import com.project.filemanagement.entity.UserPermissionId;
import com.project.filemanagement.entity.UserRoleEntity;
import com.project.filemanagement.repository.PermissionRepository;
import com.project.filemanagement.repository.RolePermissionRepository;
import com.project.filemanagement.repository.RoleRepository;
import com.project.filemanagement.repository.UserPermissionRepository;
import com.project.filemanagement.repository.UserRoleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RbacService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRoleRepository userRoleRepository;
    private final UserPermissionRepository userPermissionRepository;

    public Optional<RoleEntity> getRoleByName(String roleName) {
        return roleRepository.findByName(roleName);
    }

    public List<RolePermissionEntity> getRolePermissions(RoleEntity role) {
        return rolePermissionRepository.findByRole(role);
    }

    public List<UserRoleEntity> getUserRoles(User user) {
        return userRoleRepository.findByUser(user);
    }

    public List<RoleEntity> getRolesForUser(User user) {
        return userRoleRepository.findByUser(user)
                .stream()
                .map(UserRoleEntity::getRole)
                .toList();
    }

    public List<String> getPermissionCodesForRole(RoleEntity role) {
        return rolePermissionRepository.findByRole(role)
                .stream()
                .map(rolePermission -> rolePermission.getPermission().getCode())
                .toList();
    }

    // Permission codes the user inherits from their assigned role(s).
    public List<String> getRolePermissionCodesForUser(User user) {
        return getRolesForUser(user)
                .stream()
                .flatMap(role -> getPermissionCodesForRole(role).stream())
                .distinct()
                .toList();
    }

    // Permission codes granted directly to this user (on top of their role).
    public List<String> getDirectPermissionCodesForUser(User user) {
        return userPermissionRepository.findByUser(user)
                .stream()
                .map(userPermission -> userPermission.getPermission().getCode())
                .distinct()
                .toList();
    }

    // Effective permissions = role-inherited + directly-granted, de-duplicated.
    // This is what the security layer (JwtAuthFilter) loads on every request, so
    // any change here takes effect on the user's next call — no re-login needed.
    public List<String> getPermissionCodesForUser(User user) {
        return Stream.concat(
                        getRolePermissionCodesForUser(user).stream(),
                        getDirectPermissionCodesForUser(user).stream())
                .distinct()
                .toList();
    }

    // The full catalog of permissions that exist in the system.
    public List<PermissionEntity> getAllPermissions() {
        return permissionRepository.findAll();
    }

    // Replace a user's direct permission grants with exactly the given codes.
    // Unknown/blank codes are ignored. Delete runs first (and flushes) so the
    // subsequent inserts can't collide with the rows being replaced.
    @Transactional
    public void setDirectPermissions(User user, List<String> codes) {
        userPermissionRepository.deleteByUser(user);
        userPermissionRepository.flush();

        if (codes == null) {
            return;
        }

        codes.stream()
                .filter(code -> code != null && !code.isBlank())
                .distinct()
                .forEach(code -> permissionRepository.findByCode(code)
                        .ifPresent(permission -> userPermissionRepository.save(
                                UserPermissionEntity.builder()
                                        .id(new UserPermissionId(
                                                user.getId(),
                                                permission.getId()))
                                        .user(user)
                                        .permission(permission)
                                        .build())));
    }
}
