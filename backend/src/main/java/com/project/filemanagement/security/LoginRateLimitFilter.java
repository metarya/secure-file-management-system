package com.project.filemanagement.security;

import java.io.IOException;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.project.filemanagement.service.RedisRateLimitService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimitFilter.class);
    private static final String LOGIN_PATH = "/api/auth/login";

    private final RedisRateLimitService rateLimitService;

    public LoginRateLimitFilter(RedisRateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        if ("POST".equalsIgnoreCase(request.getMethod())
                && LOGIN_PATH.equals(request.getRequestURI())) {

            String clientIp = RateLimitSupport.resolveClientIp(request);

            if (!rateLimitService.allowLoginAttempt(clientIp)) {
                log.warn("RATE_LIMIT_EXCEEDED endpoint={} ip={} timestamp={}",
                        LOGIN_PATH, clientIp, LocalDateTime.now());
                RateLimitSupport.reject(response,
                        "Too many login attempts. Please try again in one minute.");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
