package com.project.filemanagement.repository;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.FilePermission;
import com.project.filemanagement.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FilePermissionRepository extends JpaRepository<FilePermission, Long> {

    List<FilePermission> findBySharedWithUser(User sharedWithUser);

    Optional<FilePermission> findByFileAndSharedWithUser(FileEntity file, User sharedWithUser);

    boolean existsByFileAndSharedWithUser(FileEntity file, User sharedWithUser);
}