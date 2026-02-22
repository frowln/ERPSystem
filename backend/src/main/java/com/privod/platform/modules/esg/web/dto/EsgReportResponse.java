package com.privod.platform.modules.esg.web.dto;

import com.privod.platform.modules.esg.domain.EsgReport;
import com.privod.platform.modules.esg.domain.EsgReportStatus;
import com.privod.platform.modules.esg.domain.EsgReportType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EsgReportResponse(
        UUID id,
        UUID projectId,
        EsgReportType reportType,
        String reportTypeDisplayName,
        String reportPeriod,
        EsgReportStatus status,
        String statusDisplayName,
        String title,
        BigDecimal totalCarbon,
        BigDecimal totalEnergy,
        BigDecimal totalWaste,
        BigDecimal totalWater,
        BigDecimal wasteDiversionRate,
        BigDecimal carbonIntensity,
        String dataJson,
        BigDecimal carbonTarget,
        Boolean carbonTargetMet,
        String benchmarkJson,
        Instant generatedAt,
        UUID approvedBy,
        Instant approvedAt,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static EsgReportResponse fromEntity(EsgReport entity) {
        return new EsgReportResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getReportType(),
                entity.getReportType().getDisplayName(),
                entity.getReportPeriod(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getTitle(),
                entity.getTotalCarbon(),
                entity.getTotalEnergy(),
                entity.getTotalWaste(),
                entity.getTotalWater(),
                entity.getWasteDiversionRate(),
                entity.getCarbonIntensity(),
                entity.getDataJson(),
                entity.getCarbonTarget(),
                entity.getCarbonTargetMet(),
                entity.getBenchmarkJson(),
                entity.getGeneratedAt(),
                entity.getApprovedBy(),
                entity.getApprovedAt(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
