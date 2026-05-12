package com.project.filemanagement.repository;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.FilePermission;
import com.project.filemanagement.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface FilePermissionRepository extends JpaRepository<FilePermission, Long> {

    List<FilePermission> findBySharedWithUser(User sharedWithUser);

    Optional<FilePermission> findByFileAndSharedWithUser(FileEntity file, User sharedWithUser);

    boolean existsByFileAndSharedWithUser(FileEntity file, User sharedWithUser);

    @Modifying
    @Transactional
    @Query(
        value = "DELETE fp FROM file_permissions fp " +
                "JOIN users u ON fp.shared_with_user_id = u.id " +
                "WHERE fp.file_id = :fileId AND u.email = :userEmail",
        nativeQuery = true
    )
    int deleteSharedEntryByFileIdAndUserEmail(
            @Param("fileId") Long fileId,
            @Param("userEmail") String userEmail
    );
    Optional<FilePermission> findByFile_IdAndSharedWithUser_Email(Long fileId, String email);
}
