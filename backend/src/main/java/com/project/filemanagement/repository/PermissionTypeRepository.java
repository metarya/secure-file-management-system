package com.project.filemanagement.repository;

import com.project.filemanagement.entity.PermissionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionTypeRepository extends JpaRepository<PermissionType, String> {

    Optional<PermissionType> findByCodeAndActiveTrue(String code);

    boolean existsByCodeAndActiveTrue(String code);
}
