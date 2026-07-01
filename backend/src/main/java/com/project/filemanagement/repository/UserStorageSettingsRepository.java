package com.project.filemanagement.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.project.filemanagement.entity.UserStorageSettings;

@Repository
public interface UserStorageSettingsRepository
        extends JpaRepository<UserStorageSettings, Long> {

    Optional<UserStorageSettings> findByUserId(Long userId);

    List<UserStorageSettings> findByUserIdIn(List<Long> userIds);
}
