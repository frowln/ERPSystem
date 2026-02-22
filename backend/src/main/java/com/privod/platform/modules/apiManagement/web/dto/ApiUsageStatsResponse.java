package com.privod.platform.modules.apiManagement.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ApiUsageStatsResponse(
        UUID apiKeyId,
        LocalDate from,
        LocalDate to,
        long totalRequests,
        long successfulRequests,
        long failedRequests,
        double averageResponseTimeMs,
        long totalRequestSizeBytes,
        long totalResponseSizeBytes
) {
}
