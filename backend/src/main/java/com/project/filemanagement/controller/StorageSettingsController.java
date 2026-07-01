package com.project.filemanagement.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.project.filemanagement.dto.StorageConnectionTestResponse;
import com.project.filemanagement.dto.StorageSettingsResponse;
import com.project.filemanagement.dto.UpdateStorageSettingsRequest;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.security.AuthenticatedUserService;
import com.project.filemanagement.service.UserStorageSettingsService;

/**
 * Each user manages THEIR OWN storage configuration here. Every endpoint scopes
 * to the authenticated caller — a user can only read/modify/test their own
 * settings, and secrets are never returned.
 */
@RestController
@RequestMapping("/api/storage")
public class StorageSettingsController {

    private final UserStorageSettingsService storageSettingsService;
    private final AuthenticatedUserService authenticatedUserService;

    public StorageSettingsController(
            UserStorageSettingsService storageSettingsService,
            AuthenticatedUserService authenticatedUserService
    ) {
        this.storageSettingsService = storageSettingsService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping("/settings")
    public StorageSettingsResponse getSettings(Authentication authentication) {
        User user = authenticatedUserService.requireUser(authentication);
        return storageSettingsService.getSettings(user);
    }

    @PutMapping("/settings")
    public StorageSettingsResponse updateSettings(
            @RequestBody UpdateStorageSettingsRequest request,
            Authentication authentication
    ) {
        User user = authenticatedUserService.requireUser(authentication);
        return storageSettingsService.updateSettings(user, request);
    }

    /** Test a provider connection before saving. */
    @PostMapping("/test")
    public StorageConnectionTestResponse testConnection(
            @RequestBody UpdateStorageSettingsRequest request,
            Authentication authentication
    ) {
        User user = authenticatedUserService.requireUser(authentication);
        return storageSettingsService.testConnection(user, request);
    }
}
