package com.project.filemanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.filemanagement.entity.RoleEntity;
import com.project.filemanagement.entity.RolePermissionEntity;

public interface RolePermissionRepository
        extends JpaRepository<RolePermissionEntity, Long> {

    List<RolePermissionEntity> findByRole(RoleEntity role);
}