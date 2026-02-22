package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.AccessBlockStatus;
import com.privod.platform.modules.safety.domain.SafetyAccessBlock;

import java.time.Instant;
import java.util.UUID;

public record AccessBlockResponse(
        UUID id,
        UUID organizationId,
        UUID employeeId,
        String reason,
        Instant blockedAt,
        Instant resolvedAt,
        UUID resolvedBy,
        AccessBlockStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt
) {
    public static AccessBlockResponse fromEntity(SafetyAccessBlock entity) {
        return new AccessBlockResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getEmployeeId(),
                entity.getReason(),
                entity.getBlockedAt(),
                entity.getResolvedAt(),
                entity.getResolvedBy(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
