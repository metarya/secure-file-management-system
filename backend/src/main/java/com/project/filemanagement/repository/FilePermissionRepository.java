package com.project.filemanagement.repository;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.FilePermission;
import com.project.filemanagement.entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface FilePermissionRepository extends JpaRepository<FilePermission, Long> {

    List<FilePermission> findBySharedWithUser(User sharedWithUser);

    // Shared with me: a user's shares whose underlying file is still live,
    // paginated. The "File_Deleted" traversal pushes the deleted filter into
    // the query so paging counts match what the user actually sees.
    Page<FilePermission> findBySharedWithUserAndFile_DeletedFalse(
            User sharedWithUser,
            Pageable pageable
    );

    Optional<FilePermission> findByFileAndSharedWithUser(FileEntity file, User sharedWithUser);

    boolean existsByFileAndSharedWithUser(FileEntity file, User sharedWithUser);

    // Revoke every share granted TO a user (used when deleting that user).
    @Modifying
    @Transactional
    @Query("DELETE FROM FilePermission fp WHERE fp.sharedWithUser = :user")
    void deleteAllBySharedWithUser(@Param("user") User user);

    // Revoke every share ON a file (used before a file row is hard-deleted).
    @Modifying
    @Transactional
    @Query("DELETE FROM FilePermission fp WHERE fp.file = :file")
    void deleteAllByFile(@Param("file") FileEntity file);

    Optional<FilePermission> findByFile_IdAndSharedWithUser_Email(Long fileId, String email);

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
}
