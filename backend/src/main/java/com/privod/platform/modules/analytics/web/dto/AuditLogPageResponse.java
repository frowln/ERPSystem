package com.privod.platform.modules.analytics.web.dto;

import java.util.List;

public record AuditLogPageResponse(
        List<AuditLogEntryResponse> content,
        long totalElements,
        int totalPages,
        int page,
        int size
) {
}
