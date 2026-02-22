package com.privod.platform.modules.compliance.web.dto;

/**
 * Агрегированная статистика по соблюдению требований 152-ФЗ.
 */
public record ComplianceDashboardResponse(
        long totalConsents,
        long activeConsents,
        long pendingRequests,
        long overdueRequests,
        long piiAccessCount30d
) {
}
