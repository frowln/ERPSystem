package com.privod.platform.modules.apiManagement.web.dto;

import com.privod.platform.modules.apiManagement.domain.ApiUsageLog;

import java.time.Instant;
import java.util.UUID;

public record ApiUsageLogResponse(
        UUID id,
        UUID organizationId,
        UUID apiKeyId,
        String endpoint,
        String method,
        int statusCode,
        Integer responseTimeMs,
        Long requestSizeBytes,
        Long responseSizeBytes,
        String ipAddress,
        String userAgent,
        String errorMessage,
        Instant requestedAt,
        Instant createdAt
) {
    public static ApiUsageLogResponse fromEntity(ApiUsageLog entity) {
        return new ApiUsageLogResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getApiKeyId(),
                entity.getEndpoint(),
                entity.getMethod(),
                entity.getStatusCode(),
                entity.getResponseTimeMs(),
                entity.getRequestSizeBytes(),
                entity.getResponseSizeBytes(),
                entity.getIpAddress(),
                entity.getUserAgent(),
                entity.getErrorMessage(),
                entity.getRequestedAt(),
                entity.getCreatedAt()
        );
    }
}
