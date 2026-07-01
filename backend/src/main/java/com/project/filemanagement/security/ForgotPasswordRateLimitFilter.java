package com.project.filemanagement.security;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.filemanagement.service.RedisRateLimitService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class ForgotPasswordRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ForgotPasswordRateLimitFilter.class);
    private static final String FORGOT_PATH = "/api/auth/forgot-password";

    private final RedisRateLimitService rateLimitService;
    private final ObjectMapper objectMapper;

    public ForgotPasswordRateLimitFilter(
            RedisRateLimitService rateLimitService,
            ObjectMapper objectMapper) {
        this.rateLimitService = rateLimitService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {

        if (!("POST".equalsIgnoreCase(request.getMethod())
                && FORGOT_PATH.equals(request.getRequestURI()))) {
            chain.doFilter(request, response);
            return;
        }

        // Cache the body so it can be re-read by the downstream controller.
        byte[] bodyBytes = request.getInputStream().readAllBytes();
        String email = extractEmail(bodyBytes);

        if (email != null && !email.isBlank()) {
            if (!rateLimitService.allowForgotPassword(email)) {
                String clientIp = RateLimitSupport.resolveClientIp(request);
                log.warn("RATE_LIMIT_EXCEEDED endpoint={} ip={} email={} timestamp={}",
                        FORGOT_PATH, clientIp, email, LocalDateTime.now());
                RateLimitSupport.reject(response,
                        "Too many password reset requests. Please try again later.");
                return;
            }
        }

        chain.doFilter(new CachedBodyRequestWrapper(request, bodyBytes), response);
    }

    private String extractEmail(byte[] bodyBytes) {
        try {
            JsonNode node = objectMapper.readTree(bodyBytes);
            JsonNode emailNode = node.get("email");
            return (emailNode != null && !emailNode.isNull()) ? emailNode.asText() : null;
        } catch (IOException e) {
            return null;
        }
    }

    private static final class CachedBodyRequestWrapper extends HttpServletRequestWrapper {

        private final byte[] cachedBody;

        CachedBodyRequestWrapper(HttpServletRequest request, byte[] cachedBody) {
            super(request);
            this.cachedBody = cachedBody;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream byteStream = new ByteArrayInputStream(cachedBody);
            return new ServletInputStream() {
                @Override public int read() { return byteStream.read(); }
                @Override public boolean isFinished() { return byteStream.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener listener) {
                    throw new UnsupportedOperationException();
                }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(
                    new ByteArrayInputStream(cachedBody), StandardCharsets.UTF_8));
        }
    }
}
