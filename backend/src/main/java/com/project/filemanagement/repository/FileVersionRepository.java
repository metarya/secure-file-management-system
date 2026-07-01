package com.project.filemanagement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.project.filemanagement.entity.FileVersion;

@Repository
public interface FileVersionRepository
        extends JpaRepository<FileVersion, Long> {

    /** All versions of a file, newest first. */
    List<FileVersion> findByFileIdOrderByVersionNumberDesc(Long fileId);

    /** A specific version, scoped to its file so ids can't be probed across files. */
    Optional<FileVersion> findByIdAndFileId(Long id, Long fileId);

    /** The current/latest version of a file, if any. */
    Optional<FileVersion> findByFileIdAndCurrentTrue(Long fileId);

    /** Highest version number assigned so far for a file (null when none exist). */
    @Query("SELECT MAX(v.versionNumber) FROM FileVersion v WHERE v.fileId = :fileId")
    Integer findMaxVersionNumber(@Param("fileId") Long fileId);
}
