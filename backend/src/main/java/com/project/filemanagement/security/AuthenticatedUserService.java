package com.project.filemanagement.security;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.UserRepository;

/**
 * Single source of truth for resolving the authenticated caller.
 *
 * Controllers and security-sensitive services resolve the current user through
 * this service instead of querying UserRepository directly, so authenticated-
 * user lookup (and its failure semantics) lives in exactly one place.
 *
 * {@link #requireUser(String)} is the primary lookup; every other method
 * delegates to it.
 */
@Service
public class AuthenticatedUserService {

    private final UserRepository userRepository;

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Primary API: resolves the {@link User} for an authenticated principal
     * email. Throws 401 if the email is missing and 404 if no such user exists.
     */
    public User requireUser(String email) {

        if (email == null || email.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authenticated user email is required"
            );
        }

        return userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Authenticated user not found"
                ));
    }

    /** Resolves the {@link User} for the current {@link Authentication}. */
    public User requireUser(Authentication authentication) {
        return requireUser(requireEmail(authentication));
    }

    /** The authenticated user's id. */
    public Long requireUserId(Authentication authentication) {
        return requireUser(authentication).getId();
    }

    /** The authenticated principal email, validated as present. */
    public String requireEmail(Authentication authentication) {

        if (authentication == null
                || authentication.getName() == null
                || authentication.getName().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Authentication is required"
            );
        }

        return authentication.getName();
    }
}
