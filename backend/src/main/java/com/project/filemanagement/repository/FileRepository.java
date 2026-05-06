package com.project.filemanagement.repository;

import com.project.filemanagement.entity.FileEntity;
import com.project.filemanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FileRepository extends JpaRepository<FileEntity, Long> {

    List<FileEntity> findByOwner(User owner);

    List<FileEntity> findByOwnerAndFileNameContainingIgnoreCase(User owner, String fileName);

    List<FileEntity> findByVisibility(String visibility);

    boolean existsByOwnerAndFileHash(User owner, String fileHash);
}
