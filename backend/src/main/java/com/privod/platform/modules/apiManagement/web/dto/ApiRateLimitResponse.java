package com.privod.platform.modules.apiManagement.web.dto;

import com.privod.platform.modules.apiManagement.domain.ApiRateLimit;

import java.time.Instant;
import java.util.UUID;

public record ApiRateLimitResponse(
        UUID id,
        UUID apiKeyId,
        int requestsPerMinute,
        int requestsPerHour,
        int requestsPerDay,
        int burstLimit,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static ApiRateLimitResponse fromEntity(ApiRateLimit entity) {
        return new ApiRateLimitResponse(
                entity.getId(),
                entity.getApiKeyId(),
                entity.getRequestsPerMinute(),
                entity.getRequestsPerHour(),
                entity.getRequestsPerDay(),
                entity.getBurstLimit(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
