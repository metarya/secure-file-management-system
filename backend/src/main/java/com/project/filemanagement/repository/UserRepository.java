package com.project.filemanagement.repository;

import com.project.filemanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    // Find user by email for login
    Optional<User> findByEmail(String email);

    // Check if email already exists during registration
    boolean existsByEmail(String email);
}
