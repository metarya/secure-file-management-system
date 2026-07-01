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
public class OtpRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(OtpRateLimitFilter.class);
    private static final String OTP_PATH = "/api/auth/verify-otp";

    private final RedisRateLimitService rateLimitService;

    public OtpRateLimitFilter(RedisRateLimitService rateLimitService) {
        this.rateLimitService = rateLimitService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        if ("POST".equalsIgnoreCase(request.getMethod())
                && OTP_PATH.equals(request.getRequestURI())) {

            String clientIp = RateLimitSupport.resolveClientIp(request);

            if (!rateLimitService.allowOtpAttempt(clientIp)) {
                log.warn("RATE_LIMIT_EXCEEDED endpoint={} ip={} timestamp={}",
                        OTP_PATH, clientIp, LocalDateTime.now());
                RateLimitSupport.reject(response,
                        "Too many OTP attempts. Please try again later.");
                return;
            }
        }

        chain.doFilter(request, response);
    }
}
