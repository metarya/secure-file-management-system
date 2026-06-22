package com.project.filemanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.filemanagement.entity.Folder;

@Repository
public interface FolderRepository extends JpaRepository<Folder, Long> {

    List<Folder> findByOwnerId(Long ownerId);

    List<Folder> findByParentFolderId(Long parentFolderId);

    List<Folder> findByOwnerIdAndParentFolderIsNull(Long ownerId);

}