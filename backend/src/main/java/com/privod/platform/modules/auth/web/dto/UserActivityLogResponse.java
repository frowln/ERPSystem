package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.auth.domain.LoginAttempt;

import java.time.Instant;
import java.util.UUID;

public record UserActivityLogResponse(
        UUID id,
        UUID userId,
        String action,
        String resourceType,
        String resourceId,
        String details,
        String ipAddress,
        Instant createdAt
) {
    public static UserActivityLogResponse fromLoginAttempt(LoginAttempt attempt) {
        boolean successful = attempt.isSuccessful();
        String action = successful ? "LOGIN_SUCCESS" : "LOGIN_FAILED";
        String details = successful ? "Successful login" : (attempt.getFailureReason() != null
                ? attempt.getFailureReason()
                : "Failed login");

        return new UserActivityLogResponse(
                attempt.getId(),
                attempt.getUserId(),
                action,
                "AUTH",
                attempt.getUserId() != null ? attempt.getUserId().toString() : attempt.getEmail(),
                details,
                attempt.getIpAddress(),
                attempt.getAttemptedAt()
        );
    }
}
