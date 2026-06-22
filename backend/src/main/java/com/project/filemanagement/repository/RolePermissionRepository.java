package com.project.filemanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.filemanagement.entity.RoleEntity;
import com.project.filemanagement.entity.RolePermissionEntity;
import com.project.filemanagement.entity.RolePermissionId;

public interface RolePermissionRepository
        extends JpaRepository<RolePermissionEntity, RolePermissionId> {

    List<RolePermissionEntity> findByRole(RoleEntity role);
}