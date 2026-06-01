package com.project.filemanagement.controller;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.dto.AdminStatsResponse;
import com.project.filemanagement.dto.AdminUserResponse;
import com.project.filemanagement.dto.UpdateRoleRequest;
import com.project.filemanagement.entity.Role;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.UserRepository;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserRepository userRepository;

    public AdminController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/test")
    public String test() {
        return "Admin access granted";
    }

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {

        long totalUsers = userRepository.count();

        long totalAdmins = userRepository.findAll()
                .stream()
                .filter(user -> user.getRole() == Role.ADMIN)
                .count();

        long totalRegularUsers = totalUsers - totalAdmins;

        return new AdminStatsResponse(
                totalUsers,
                totalAdmins,
                totalRegularUsers
        );
    }

    @GetMapping("/users")
    public List<AdminUserResponse> getAllUsers() {

        return userRepository.findAll()
                .stream()
                .map(user -> new AdminUserResponse(
                        user.getId(),
                        user.getFullName(),
                        user.getEmail(),
                        user.getRole().name(),
                        user.getCreatedAt()
                ))
                .toList();
    }

    @PatchMapping("/users/{id}/role")
    public String updateUserRole(
            @PathVariable Long id,
            @RequestBody UpdateRoleRequest request
    ) {

        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Role role = Role.valueOf(
                request.getRole().toUpperCase()
        );

        user.setRole(role);

        userRepository.save(user);

        return "Role updated successfully";
    }
}