package com.project.filemanagement.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.filemanagement.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    // Find user by email for login
    Optional<User> findByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    // Check if email already exists during registration
    boolean existsByEmail(String email);
}
