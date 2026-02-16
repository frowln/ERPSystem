package com.privod.platform.modules.auth;

import com.privod.platform.modules.auth.domain.SecurityPolicy;
import com.privod.platform.modules.auth.domain.UserSession;
import com.privod.platform.modules.auth.repository.LoginAttemptRepository;
import com.privod.platform.modules.auth.repository.SecurityPolicyRepository;
import com.privod.platform.modules.auth.repository.UserSessionRepository;
import com.privod.platform.modules.auth.service.SecurityPolicyService;
import com.privod.platform.modules.auth.web.dto.SecurityPolicyResponse;
import com.privod.platform.modules.auth.web.dto.UserSessionResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SecurityPolicyServiceTest {

    @Mock
    private SecurityPolicyRepository policyRepository;

    @Mock
    private UserSessionRepository sessionRepository;

    @Mock
    private LoginAttemptRepository loginAttemptRepository;

    @InjectMocks
    private SecurityPolicyService securityPolicyService;

    private SecurityPolicy testPolicy;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();

        testPolicy = SecurityPolicy.builder()
                .name("Политика по умолчанию")
                .passwordMinLength(8)
                .passwordRequiresUppercase(true)
                .passwordRequiresNumber(true)
                .passwordRequiresSpecial(false)
                .passwordExpiryDays(0)
                .maxLoginAttempts(5)
                .lockoutDurationMinutes(30)
                .sessionTimeoutMinutes(480)
                .requireMfa(false)
                .allowedIpRanges(List.of())
                .isActive(true)
                .build();
        testPolicy.setId(UUID.randomUUID());
    }

    @Nested
    @DisplayName("Active Policy")
    class PolicyTests {

        @Test
        @DisplayName("Should return active security policy")
        void getActivePolicy_Success() {
            when(policyRepository.findByIsActiveTrueAndDeletedFalse())
                    .thenReturn(Optional.of(testPolicy));

            SecurityPolicyResponse response = securityPolicyService.getActivePolicy();

            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo("Политика по умолчанию");
            assertThat(response.maxLoginAttempts()).isEqualTo(5);
            assertThat(response.sessionTimeoutMinutes()).isEqualTo(480);
        }

        @Test
        @DisplayName("Should return null when no active policy")
        void getActivePolicy_None() {
            when(policyRepository.findByIsActiveTrueAndDeletedFalse())
                    .thenReturn(Optional.empty());

            SecurityPolicyResponse response = securityPolicyService.getActivePolicy();

            assertThat(response).isNull();
        }
    }

    @Nested
    @DisplayName("Session Management")
    class SessionTests {

        @Test
        @DisplayName("Should create a user session")
        void createSession_Success() {
            when(sessionRepository.save(any(UserSession.class))).thenAnswer(inv -> {
                UserSession s = inv.getArgument(0);
                s.setId(UUID.randomUUID());
                s.setCreatedAt(Instant.now());
                return s;
            });

            UserSessionResponse response = securityPolicyService.createSession(
                    userId, "token-123", "192.168.1.1", "Chrome/120", 480);

            assertThat(response.userId()).isEqualTo(userId);
            assertThat(response.ipAddress()).isEqualTo("192.168.1.1");
            assertThat(response.isActive()).isTrue();
        }

        @Test
        @DisplayName("Should terminate all sessions for a user")
        void terminateAllSessions_Success() {
            when(sessionRepository.deactivateAllForUser(userId)).thenReturn(3);

            int count = securityPolicyService.terminateAllSessions(userId);

            assertThat(count).isEqualTo(3);
            verify(sessionRepository).deactivateAllForUser(userId);
        }
    }

    @Nested
    @DisplayName("Account Lockout")
    class LockoutTests {

        @Test
        @DisplayName("Should detect locked account")
        void isAccountLocked_True() {
            when(policyRepository.findByIsActiveTrueAndDeletedFalse())
                    .thenReturn(Optional.of(testPolicy));
            when(loginAttemptRepository.countByEmailAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
                    eq("test@example.com"), any(Instant.class)))
                    .thenReturn(5L);

            boolean locked = securityPolicyService.isAccountLocked("test@example.com");

            assertThat(locked).isTrue();
        }

        @Test
        @DisplayName("Should not lock account within threshold")
        void isAccountLocked_False() {
            when(policyRepository.findByIsActiveTrueAndDeletedFalse())
                    .thenReturn(Optional.of(testPolicy));
            when(loginAttemptRepository.countByEmailAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(
                    eq("test@example.com"), any(Instant.class)))
                    .thenReturn(2L);

            boolean locked = securityPolicyService.isAccountLocked("test@example.com");

            assertThat(locked).isFalse();
        }

        @Test
        @DisplayName("Should not lock when no policy exists")
        void isAccountLocked_NoPolicy() {
            when(policyRepository.findByIsActiveTrueAndDeletedFalse())
                    .thenReturn(Optional.empty());

            boolean locked = securityPolicyService.isAccountLocked("test@example.com");

            assertThat(locked).isFalse();
        }
    }
}
