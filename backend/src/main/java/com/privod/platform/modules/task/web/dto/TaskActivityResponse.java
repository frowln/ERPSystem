package com.privod.platform.modules.task.web.dto;

import com.privod.platform.infrastructure.audit.AuditLog;

import java.time.Instant;
import java.util.UUID;

public record TaskActivityResponse(
        UUID id,
        UUID taskId,
        String action,
        String field,
        String oldValue,
        String newValue,
        UUID userId,
        String userName,
        Instant timestamp
) {
    public static TaskActivityResponse fromAuditLog(AuditLog log) {
        return new TaskActivityResponse(
                log.getId(),
                log.getEntityId(),
                log.getAction().name(),
                log.getField(),
                log.getOldValue(),
                log.getNewValue(),
                log.getUserId(),
                log.getUserName(),
                log.getTimestamp()
        );
    }
}
