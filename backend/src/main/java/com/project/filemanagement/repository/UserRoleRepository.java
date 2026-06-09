package com.project.filemanagement.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.filemanagement.entity.User;
import com.project.filemanagement.entity.UserRoleEntity;
import com.project.filemanagement.entity.UserRoleId;

public interface UserRoleRepository
        extends JpaRepository<UserRoleEntity, UserRoleId> {

    List<UserRoleEntity> findByUser(User user);
}