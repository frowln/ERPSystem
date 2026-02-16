package com.privod.platform.modules.auth.service;

import com.privod.platform.modules.auth.domain.LoginAttempt;
import com.privod.platform.modules.auth.domain.SecurityPolicy;
import com.privod.platform.modules.auth.domain.UserSession;
import com.privod.platform.modules.auth.repository.LoginAttemptRepository;
import com.privod.platform.modules.auth.repository.SecurityPolicyRepository;
import com.privod.platform.modules.auth.repository.UserSessionRepository;
import com.privod.platform.modules.auth.web.dto.SecurityPolicyResponse;
import com.privod.platform.modules.auth.web.dto.UserSessionResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityPolicyService {

    private final SecurityPolicyRepository policyRepository;
    private final UserSessionRepository sessionRepository;
    private final LoginAttemptRepository loginAttemptRepository;

    @Transactional(readOnly = true)
    public SecurityPolicyResponse getActivePolicy() {
        return policyRepository.findByIsActiveTrueAndDeletedFalse()
                .map(SecurityPolicyResponse::fromEntity)
                .orElse(null);
    }

    @Transactional
    public UserSessionResponse createSession(UUID userId, String sessionToken,
                                               String ipAddress, String userAgent,
                                               int timeoutMinutes) {
        UserSession session = UserSession.builder()
                .userId(userId)
                .sessionToken(sessionToken)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .isActive(true)
                .lastActivityAt(Instant.now())
                .expiresAt(Instant.now().plus(timeoutMinutes, ChronoUnit.MINUTES))
                .build();

        session = sessionRepository.save(session);
        log.info("Session created for user {}: {}", userId, session.getId());
        return UserSessionResponse.fromEntity(session);
    }

    @Transactional(readOnly = true)
    public List<UserSessionResponse> getActiveSessions(UUID userId) {
        return sessionRepository.findByUserIdAndIsActiveTrueAndDeletedFalse(userId)
                .stream()
                .map(UserSessionResponse::fromEntity)
                .toList();
    }

    @Transactional
    public void terminateSession(UUID sessionId) {
        sessionRepository.findById(sessionId).ifPresent(session -> {
            session.deactivate();
            sessionRepository.save(session);
            log.info("Session terminated: {}", sessionId);
        });
    }

    @Transactional
    public void terminateSessionForUser(UUID sessionId, UUID userId) {
        UserSession session = sessionRepository.findById(sessionId)
                .filter(s -> !s.isDeleted())
                .orElseThrow(() -> new EntityNotFoundException("Session not found: " + sessionId));

        if (!session.getUserId().equals(userId)) {
            // Avoid leaking cross-user existence.
            throw new EntityNotFoundException("Session not found: " + sessionId);
        }

        session.deactivate();
        sessionRepository.save(session);
        log.info("Session terminated for user {}: {}", userId, sessionId);
    }

    @Transactional
    public int terminateAllSessions(UUID userId) {
        int count = sessionRepository.deactivateAllForUser(userId);
        log.info("Terminated {} sessions for user {}", count, userId);
        return count;
    }

    @Transactional
    public void recordLoginAttempt(UUID userId, String email, String ipAddress,
                                    String userAgent, boolean successful, String failureReason) {
        LoginAttempt attempt = LoginAttempt.builder()
                .userId(userId)
                .email(email)
                .ipAddress(ipAddress)
                .userAgent(userAgent)
                .isSuccessful(successful)
                .failureReason(failureReason)
                .attemptedAt(Instant.now())
                .build();

        loginAttemptRepository.save(attempt);
        log.debug("Login attempt recorded for {}: success={}", email, successful);
    }

    @Transactional(readOnly = true)
    public boolean isAccountLocked(String email) {
        SecurityPolicy policy = policyRepository.findByIsActiveTrueAndDeletedFalse().orElse(null);
        if (policy == null) {
            return false;
        }

        Instant lockoutWindow = Instant.now().minus(policy.getLockoutDurationMinutes(), ChronoUnit.MINUTES);
        long failedAttempts = loginAttemptRepository
                .countByEmailAndIsSuccessfulFalseAndAttemptedAtAfterAndDeletedFalse(email, lockoutWindow);

        return failedAttempts >= policy.getMaxLoginAttempts();
    }

    @Transactional
    public int cleanupExpiredSessions() {
        int count = sessionRepository.deactivateExpired(Instant.now());
        log.info("Cleaned up {} expired sessions", count);
        return count;
    }
}
