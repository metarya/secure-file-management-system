package com.project.filemanagement.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class RbacTestController {

    // Returns ONLY the caller's own authorities (self-introspection used by the
    // admin UI). Protected by the global authenticated() rule; it cannot expose
    // another user's permissions, so no elevated authority is required.
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
