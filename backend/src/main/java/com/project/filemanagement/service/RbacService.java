package com.project.filemanagement.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.project.filemanagement.entity.RoleEntity;
import com.project.filemanagement.entity.RolePermissionEntity;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserRoleEntity;
import com.project.filemanagement.repository.PermissionRepository;
import com.project.filemanagement.repository.RolePermissionRepository;
import com.project.filemanagement.repository.RoleRepository;
import com.project.filemanagement.repository.UserRoleRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RbacService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final RolePermissionRepository rolePermissionRepository;
    private final UserRoleRepository userRoleRepository;

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

    public List<String> getPermissionCodesForUser(User user) {

    return getRolesForUser(user)
            .stream()
            .flatMap(role -> getPermissionCodesForRole(role).stream())
            .distinct()
            .toList();
    }
}