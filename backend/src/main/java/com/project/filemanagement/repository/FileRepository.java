package com.project.filemanagement.repository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;

@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {

    List<FileEntity> findByOwner(User owner);

    List<FileEntity> findByOwnerAndFileNameContainingIgnoreCase(
            User owner,
            String fileName
    );

    // Recycle bin: a single owner's soft-deleted files.
    List<FileEntity> findByOwnerAndDeletedTrue(User owner);

    boolean existsByOwnerAndFileHashAndDeletedFalse(
            User owner,
            String fileHash
    );

    // --- Paginated (server-side pagination) --------------------------------

    // My Files: one owner's live (non-deleted) files, one page at a time.
    Page<FileEntity> findByOwnerAndDeletedFalse(User owner, Pageable pageable);

    // My Files with a search term applied to the file name.
    Page<FileEntity> findByOwnerAndDeletedFalseAndFileNameContainingIgnoreCase(
            User owner,
            String fileName,
            Pageable pageable
    );

    // Recycle bin: one owner's soft-deleted files, paginated.
    Page<FileEntity> findByOwnerAndDeletedTrue(User owner, Pageable pageable);

    // Admin Files: every file, paginated + searchable across the file name and
    // the owner's name/email. Nested "Owner_" traversal lets Spring Data both
    // filter and sort on owner.fullName / owner.email via an implicit join.
    Page<FileEntity>
    findByFileNameContainingIgnoreCaseOrOwner_FullNameContainingIgnoreCaseOrOwner_EmailContainingIgnoreCase(
            String fileName,
            String ownerFullName,
            String ownerEmail,
            Pageable pageable
    );

    // --- Provider-filtered variants (for storage-provider switching) --------

    Page<FileEntity> findByOwnerAndDeletedFalseAndStorageProvider(
            User owner, String storageProvider, Pageable pageable);

    Page<FileEntity> findByOwnerAndDeletedFalseAndFileNameContainingIgnoreCaseAndStorageProvider(
            User owner, String fileName, String storageProvider, Pageable pageable);

    Page<FileEntity> findByOwnerAndDeletedTrueAndStorageProvider(
            User owner, String storageProvider, Pageable pageable);
}
