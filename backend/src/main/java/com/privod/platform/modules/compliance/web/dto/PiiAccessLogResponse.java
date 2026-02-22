package com.privod.platform.modules.compliance.web.dto;

import com.privod.platform.modules.compliance.domain.PiiAccessLog;
import com.privod.platform.modules.compliance.domain.PiiAccessType;

import java.time.Instant;
import java.util.UUID;

public record PiiAccessLogResponse(
        UUID id,
        UUID organizationId,
        UUID userId,
        String entityType,
        UUID entityId,
        String fieldName,
        PiiAccessType accessType,
        String ipAddress,
        Instant accessedAt,
        Instant createdAt
) {
    public static PiiAccessLogResponse fromEntity(PiiAccessLog entity) {
        return new PiiAccessLogResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getUserId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getFieldName(),
                entity.getAccessType(),
                entity.getIpAddress(),
                entity.getAccessedAt(),
                entity.getCreatedAt()
        );
    }
}
