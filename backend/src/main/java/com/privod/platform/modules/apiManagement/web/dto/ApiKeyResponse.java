package com.privod.platform.modules.apiManagement.web.dto;

import com.privod.platform.modules.apiManagement.domain.ApiKey;

import java.time.Instant;
import java.util.UUID;

public record ApiKeyResponse(
        UUID id,
        String name,
        String prefix,
        UUID userId,
        String scopes,
        boolean isActive,
        Instant expiresAt,
        Instant lastUsedAt,
        long requestCount,
        int rateLimit,
        Instant createdAt,
        Instant updatedAt
) {
    public static ApiKeyResponse fromEntity(ApiKey apiKey) {
        return new ApiKeyResponse(
                apiKey.getId(),
                apiKey.getName(),
                apiKey.getPrefix(),
                apiKey.getUserId(),
                apiKey.getScopes(),
                apiKey.isActive(),
                apiKey.getExpiresAt(),
                apiKey.getLastUsedAt(),
                apiKey.getRequestCount(),
                apiKey.getRateLimit(),
                apiKey.getCreatedAt(),
                apiKey.getUpdatedAt()
        );
    }
}
