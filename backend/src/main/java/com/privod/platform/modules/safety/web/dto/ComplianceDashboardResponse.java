package com.privod.platform.modules.safety.web.dto;

public record ComplianceDashboardResponse(
        long totalEmployees,
        long compliantCount,
        long nonCompliantCount,
        long expiringSoonCount,
        long briefingsScheduled,
        long overdueBriefings,
        long activeAccessBlocks
) {
}
