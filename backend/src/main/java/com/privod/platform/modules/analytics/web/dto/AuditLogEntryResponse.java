package com.privod.platform.modules.analytics.web.dto;

public record AuditLogEntryResponse(
        String id,
        String module,
        String action_type,
        int count,
        String userName,
        String timestamp,
        String description
) {
}
