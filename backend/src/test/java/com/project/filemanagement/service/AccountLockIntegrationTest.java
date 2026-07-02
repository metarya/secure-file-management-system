package com.project.filemanagement.service;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.test.context.TestPropertySource;

import com.project.filemanagement.dto.LoginRequest;
import com.project.filemanagement.dto.LoginResponse;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.UserRepository;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Integration test for the account lock lifecycle.
 *
 * Uses a real Spring context backed by H2, a real UserRepository, and the real
 * AuthService so that actual DB writes are verified — not just in-memory Java
 * object state. EmailService and StringRedisTemplate are replaced with mocks
 * so that no SMTP or Redis connection is required.
 */
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@TestPropertySource(locations = "classpath:application-test.properties")
class AccountLockIntegrationTest {

    private static final String EMAIL    = "lockintegration@example.com";
    private static final String PASSWORD = "correct-password-123";

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder();

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    // Prevent Spring from trying to open a real Redis connection.
    @MockBean
    private StringRedisTemplate stringRedisTemplate;

    // Prevent Spring from trying to connect to an SMTP server.
    @MockBean
    private EmailService emailService;

    @AfterEach
    void cleanup() {
        userRepository.findByEmail(EMAIL).ifPresent(userRepository::delete);
    }

    // -----------------------------------------------------------------------
    // Core regression: expired lock must be cleared in the DB after login
    // -----------------------------------------------------------------------

    /**
     * A user whose lock has already expired logs in with the correct password.
     * Both account_locked_until and failed_login_attempts must be NULL / 0 in
     * the database row after the login — not just in the in-memory entity.
     */
    @Test
    void successfulLogin_withExpiredLock_clearsLockInDatabase() {
        // Given: user persisted with an expired lock
        User user = new User("Lock Test", EMAIL, ENCODER.encode(PASSWORD));
        user.setFailedLoginAttempts(5);
        user.setAccountLockedUntil(LocalDateTime.now().minusMinutes(30));
        userRepository.save(user);

        // When: correct-password login after the lock has expired
        LoginResponse response = authService.loginUser(new LoginRequest(EMAIL, PASSWORD));

        // Then: login is accepted
        assertEquals("Login successful", response.getMessage(),
                "Login should succeed once the lock has expired");

        // Then: re-fetch a FRESH entity from the database (bypasses L1 cache)
        User fromDb = userRepository.findByEmail(EMAIL).orElseThrow(
                () -> new AssertionError("User must still exist after login"));

        assertNull(fromDb.getAccountLockedUntil(),
                "account_locked_until must be NULL in the database after successful login");
        assertEquals(0, fromDb.getFailedLoginAttempts(),
                "failed_login_attempts must be 0 in the database after successful login");
    }

    // -----------------------------------------------------------------------
    // Lock is still enforced while the timestamp is in the future
    // -----------------------------------------------------------------------

    @Test
    void login_blockedWhileLockIsActive() {
        User user = new User("Lock Test", EMAIL, ENCODER.encode(PASSWORD));
        user.setFailedLoginAttempts(5);
        user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        LoginResponse response = authService.loginUser(new LoginRequest(EMAIL, PASSWORD));

        assertEquals("Your account is temporarily locked. Please try again later.",
                response.getMessage());

        // Lock data must remain untouched in the DB
        User fromDb = userRepository.findByEmail(EMAIL).orElseThrow();
        assertNotNull(fromDb.getAccountLockedUntil());
    }

    // -----------------------------------------------------------------------
    // Successful clean login (no prior lock) leaves both fields at zero/null
    // -----------------------------------------------------------------------

    @Test
    void successfulLogin_noLock_leavesFieldsClean() {
        User user = new User("Lock Test", EMAIL, ENCODER.encode(PASSWORD));
        userRepository.save(user);

        LoginResponse response = authService.loginUser(new LoginRequest(EMAIL, PASSWORD));

        assertEquals("Login successful", response.getMessage());

        User fromDb = userRepository.findByEmail(EMAIL).orElseThrow();
        assertNull(fromDb.getAccountLockedUntil());
        assertEquals(0, fromDb.getFailedLoginAttempts());
    }

    // -----------------------------------------------------------------------
    // Five wrong-password attempts lock the account in the database
    // -----------------------------------------------------------------------

    @Test
    void fiveWrongPasswords_locksAccount_inDatabase() {
        User user = new User("Lock Test", EMAIL, ENCODER.encode(PASSWORD));
        userRepository.save(user);

        for (int i = 0; i < 5; i++) {
            authService.loginUser(new LoginRequest(EMAIL, "wrong-password"));
        }

        User fromDb = userRepository.findByEmail(EMAIL).orElseThrow();
        assertNotNull(fromDb.getAccountLockedUntil(),
                "account_locked_until must be set in DB after 5 failures");
        assertTrue(fromDb.getAccountLockedUntil().isAfter(LocalDateTime.now()),
                "lock must be in the future");
        assertEquals(5, fromDb.getFailedLoginAttempts());
    }
}
