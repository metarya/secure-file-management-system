package com.project.filemanagement.repository;

import java.util.List;

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

    List<FileEntity> findByVisibility(String visibility);

    List<FileEntity> findByDeletedFalse();

    boolean existsByOwnerAndFileHash(
            User owner,
            String fileHash
    );
}
