package com.project.filemanagement.service;

import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
public class RedisRateLimitService {

    private static final Logger log = LoggerFactory.getLogger(RedisRateLimitService.class);

    private static final String LOGIN_PREFIX  = "login:";
    private static final String OTP_PREFIX    = "otp:";
    private static final String FORGOT_PREFIX = "forgot:";

    private static final int  LOGIN_MAX              = 5;
    private static final long LOGIN_WINDOW_SECONDS   = 60L;

    private static final int  OTP_MAX                = 5;
    private static final long OTP_WINDOW_SECONDS     = 300L;

    private static final int  FORGOT_MAX             = 3;
    private static final long FORGOT_WINDOW_SECONDS  = 900L;

    private final StringRedisTemplate redisTemplate;

    public RedisRateLimitService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean allowLoginAttempt(String clientIp) {
        return allow(LOGIN_PREFIX + clientIp, LOGIN_MAX, LOGIN_WINDOW_SECONDS);
    }

    public boolean allowOtpAttempt(String clientIp) {
        return allow(OTP_PREFIX + clientIp, OTP_MAX, OTP_WINDOW_SECONDS);
    }

    public boolean allowForgotPassword(String email) {
        return allow(FORGOT_PREFIX + email, FORGOT_MAX, FORGOT_WINDOW_SECONDS);
    }

    // Increments the counter for the given key and sets the TTL only on first
    // creation. Returns true when the request is within the allowed threshold.
    // Fails open (allows the request) if Redis is unavailable so that a Redis
    // outage does not lock out all users.
    private boolean allow(String key, int max, long windowSeconds) {
        try {
            Long count = redisTemplate.opsForValue().increment(key);
            if (count == null) {
                return true;
            }
            if (count == 1L) {
                redisTemplate.expire(key, windowSeconds, TimeUnit.SECONDS);
            }
            return count <= max;
        } catch (Exception e) {
            log.error("Redis unavailable during rate-limit check for key='{}': {}", key, e.getMessage());
            return true;
        }
    }
}
