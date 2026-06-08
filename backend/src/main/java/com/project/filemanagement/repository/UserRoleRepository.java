package com.project.filemanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserRoleEntity;

public interface UserRoleRepository
        extends JpaRepository<UserRoleEntity, Long> {

    List<UserRoleEntity> findByUser(User user);
}