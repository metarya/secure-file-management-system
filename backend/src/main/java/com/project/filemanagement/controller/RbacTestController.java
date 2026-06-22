package com.project.filemanagement.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.service.RbacService;

import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class RbacTestController {

    private final UserRepository userRepository;
    private final RbacService rbacService;

    @GetMapping("/api/rbac/test/{userId}")
    public List<String> testUserPermissions(
            @PathVariable Long userId) {

        User user = userRepository.findById(userId)
                .orElseThrow();

        return rbacService.getPermissionCodesForUser(user);
    }

    @GetMapping("/api/rbac/me")
    public Object me(Authentication authentication) {

        if (authentication == null) {
            return "Authentication is null";
        }

        return authentication.getAuthorities()
                .stream()
                .map(authority -> authority.getAuthority())
                .toList();
    }
}