package com.privod.platform.modules.permission.web.dto;

import com.privod.platform.modules.permission.domain.AuditPermissionChange;
import com.privod.platform.modules.permission.domain.PermissionAuditAction;

import java.time.Instant;
import java.util.UUID;

public record AuditPermissionChangeResponse(
        UUID id,
        UUID userId,
        PermissionAuditAction action,
        String actionDisplayName,
        UUID targetUserId,
        UUID groupId,
        String details,
        String ipAddress,
        Instant createdAt
) {
    public static AuditPermissionChangeResponse fromEntity(AuditPermissionChange audit) {
        return new AuditPermissionChangeResponse(
                audit.getId(),
                audit.getUserId(),
                audit.getAction(),
                audit.getAction().getDisplayName(),
                audit.getTargetUserId(),
                audit.getGroupId(),
                audit.getDetails(),
                audit.getIpAddress(),
                audit.getCreatedAt()
        );
    }
}
