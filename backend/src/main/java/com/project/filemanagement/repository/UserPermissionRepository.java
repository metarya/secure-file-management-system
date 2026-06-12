package com.project.filemanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserPermissionEntity;
import com.project.filemanagement.entity.UserPermissionId;

public interface UserPermissionRepository
        extends JpaRepository<UserPermissionEntity, UserPermissionId> {

    List<UserPermissionEntity> findByUser(User user);

    void deleteByUser(User user);
}
