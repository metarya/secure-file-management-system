package com.project.filemanagement.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import com.project.filemanagement.dto.LoginRequest;
import com.project.filemanagement.dto.LoginResponse;
import com.project.filemanagement.entity.User;
import com.project.filemanagement.repository.RoleRepository;
import com.project.filemanagement.repository.UserRepository;
import com.project.filemanagement.repository.UserRoleRepository;
import com.project.filemanagement.security.JwtUtil;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AccountLockTest {

    @Mock private UserRepository userRepository;
    @Mock private JwtUtil jwtUtil;
    @Mock private EmailService emailService;
    @Mock private AuditLogService auditLogService;
    @Mock private ActivityLogService activityLogService;
    @Mock private UserRoleRepository userRoleRepository;
    @Mock private RoleRepository roleRepository;

    private AuthService authService;

    private static final String EMAIL    = "user@example.com";
    private static final String PASSWORD = "correct-password";

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        authService = new AuthService(
                userRepository,
                jwtUtil,
                emailService,
                auditLogService,
                activityLogService,
                userRoleRepository,
                roleRepository);

        when(userRoleRepository.findByUser(any())).thenReturn(List.of());
        when(jwtUtil.generateToken(anyString(), anyString())).thenReturn("mock-jwt-token");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private User activeUser() {
        User user = new User(EMAIL, EMAIL, encoder.encode(PASSWORD));
        user.setFullName("Test User");
        return user;
    }

    // -----------------------------------------------------------------------
    // 1. Failed login increments counter
    // -----------------------------------------------------------------------

    @Test
    void failedLogin_incrementsFailedAttemptCounter() {
        User user = activeUser();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        authService.loginUser(new LoginRequest(EMAIL, "wrong-password"));

        assertEquals(1, user.getFailedLoginAttempts());
    }

    // -----------------------------------------------------------------------
    // 2. Account locks after the configured number of failures (5)
    // -----------------------------------------------------------------------

    @Test
    void accountLocks_afterMaxFailedAttempts() {
        User user = activeUser();
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        for (int i = 0; i < 5; i++) {
            authService.loginUser(new LoginRequest(EMAIL, "wrong-password"));
        }

        assertNotNull(user.getAccountLockedUntil(),
                "accountLockedUntil must be set after 5 failures");
        assertTrue(user.getAccountLockedUntil().isAfter(LocalDateTime.now()),
                "lock must be in the future");
    }

    // -----------------------------------------------------------------------
    // 3. Login is blocked while the lock is active
    // -----------------------------------------------------------------------

    @Test
    void loginBlocked_whileLockIsActive() {
        User user = activeUser();
        user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(10));
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        LoginResponse response = authService.loginUser(new LoginRequest(EMAIL, PASSWORD));

        assertEquals("Your account is temporarily locked. Please try again later.",
                response.getMessage());
    }

    // -----------------------------------------------------------------------
    // 4. Account automatically unlocks after lock duration expires
    // -----------------------------------------------------------------------

    @Test
    void expiredLock_isAutoCleared_andLoginProceeds() {
        User user = activeUser();
        // Simulate a lock that expired 1 second ago
        user.setAccountLockedUntil(LocalDateTime.now().minusSeconds(1));
        user.setFailedLoginAttempts(5);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        LoginResponse response = authService.loginUser(new LoginRequest(EMAIL, PASSWORD));

        assertEquals("Login successful", response.getMessage());
        assertNull(user.getAccountLockedUntil(),
                "accountLockedUntil must be null after expired lock is cleared");
        assertEquals(0, user.getFailedLoginAttempts(),
                "failedLoginAttempts must be 0 after expired lock is cleared");
    }

    // -----------------------------------------------------------------------
    // 5. Successful login resets both failedLoginAttempts and accountLockedUntil
    // -----------------------------------------------------------------------

    @Test
    void successfulLogin_resetsBothLockFields() {
        User user = activeUser();
        user.setFailedLoginAttempts(3);
        user.setAccountLockedUntil(null); // not currently locked
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        LoginResponse response = authService.loginUser(new LoginRequest(EMAIL, PASSWORD));

        assertEquals("Login successful", response.getMessage());
        assertEquals(0, user.getFailedLoginAttempts(),
                "failedLoginAttempts must be 0 after successful login");
        assertNull(user.getAccountLockedUntil(),
                "accountLockedUntil must be null after successful login");
    }

    // -----------------------------------------------------------------------
    // 6. DB contains NULL for account_locked_until after a successful login
    // -----------------------------------------------------------------------

    @Test
    void successfulLogin_persistsNullAccountLockedUntil() {
        User user = activeUser();
        // Simulate stale lock timestamp that has expired
        user.setAccountLockedUntil(LocalDateTime.now().minusMinutes(5));
        user.setFailedLoginAttempts(5);
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));

        authService.loginUser(new LoginRequest(EMAIL, PASSWORD));

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository, atLeastOnce()).save(captor.capture());

        // The last save call must persist a user with accountLockedUntil == null
        User lastSaved = captor.getAllValues().get(captor.getAllValues().size() - 1);
        assertNull(lastSaved.getAccountLockedUntil(),
                "account_locked_until must be NULL in the DB after successful login");
        assertEquals(0, lastSaved.getFailedLoginAttempts(),
                "failed_login_attempts must be 0 in the DB after successful login");
    }

    // -----------------------------------------------------------------------
    // 7. resetFailedLoginAttempts() clears both fields on the entity
    // -----------------------------------------------------------------------

    @Test
    void resetFailedLoginAttempts_clearsBothFields() {
        User user = activeUser();
        user.setFailedLoginAttempts(5);
        user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(10));

        user.resetFailedLoginAttempts();

        assertEquals(0, user.getFailedLoginAttempts());
        assertNull(user.getAccountLockedUntil());
    }

    // -----------------------------------------------------------------------
    // 8. isAccountLocked() returns false when the lock timestamp has expired
    // -----------------------------------------------------------------------

    @Test
    void isAccountLocked_returnsFalse_whenLockHasExpired() {
        User user = activeUser();
        user.setAccountLockedUntil(LocalDateTime.now().minusSeconds(1));

        assertFalse(user.isAccountLocked());
    }

    // -----------------------------------------------------------------------
    // 9. isAccountLocked() returns true only while timestamp is in the future
    // -----------------------------------------------------------------------

    @Test
    void isAccountLocked_returnsTrue_whenLockIsActive() {
        User user = activeUser();
        user.setAccountLockedUntil(LocalDateTime.now().plusMinutes(15));

        assertTrue(user.isAccountLocked());
    }
}
