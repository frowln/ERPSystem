package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.auth.domain.UserSession;

import java.time.Instant;
import java.util.UUID;

public record UserSessionResponse(
        UUID id,
        UUID userId,
        String ipAddress,
        String userAgent,
        boolean isActive,
        Instant lastActivityAt,
        Instant expiresAt,
        Instant createdAt
) {
    public static UserSessionResponse fromEntity(UserSession entity) {
        return new UserSessionResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getIpAddress(),
                entity.getUserAgent(),
                entity.isActive(),
                entity.getLastActivityAt(),
                entity.getExpiresAt(),
                entity.getCreatedAt()
        );
    }
}
