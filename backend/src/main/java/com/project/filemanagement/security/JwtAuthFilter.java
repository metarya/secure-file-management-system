package com.project.filemanagement.security;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.service.RbacService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final RbacService rbacService;

    public JwtAuthFilter(
            JwtUtil jwtUtil,
            UserRepository userRepository,
            RbacService rbacService) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.rbacService = rbacService;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);


        if (!jwtUtil.validateToken(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        String email = jwtUtil.extractEmail(token);

        User user = userRepository.findByEmail(email)
                .orElse(null);

        if (email != null
                && user != null
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            List<SimpleGrantedAuthority> authorities = new ArrayList<>();

            // RBAC permissions
            rbacService.getPermissionCodesForUser(user)
                    .forEach(permission ->
                            authorities.add(
                                    new SimpleGrantedAuthority(permission)
                            )
                    );

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            authorities
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource()
                            .buildDetails(request)
            );

            SecurityContextHolder.getContext()
                    .setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }
}