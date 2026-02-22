package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.SafetyRiskReport;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record WeeklyRiskReportResponse(
        UUID id,
        String reportWeek,
        int projectCount,
        BigDecimal avgRiskScore,
        int criticalProjects,
        int highRiskProjects,
        String topRecommendationsJson,
        Instant generatedAt,
        Instant createdAt
) {
    public static WeeklyRiskReportResponse fromEntity(SafetyRiskReport report) {
        return new WeeklyRiskReportResponse(
                report.getId(),
                report.getReportWeek(),
                report.getProjectCount(),
                report.getAvgRiskScore(),
                report.getCriticalProjects(),
                report.getHighRiskProjects(),
                report.getTopRecommendationsJson(),
                report.getGeneratedAt(),
                report.getCreatedAt()
        );
    }
}
