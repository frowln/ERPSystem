package com.privod.platform.modules.ops.web.dto;

import com.privod.platform.modules.ops.domain.DailyReport;
import com.privod.platform.modules.ops.domain.WeatherImpact;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DailyReportResponse(
        UUID id,
        UUID workOrderId,
        LocalDate reportDate,
        String workDone,
        String issues,
        String materialsUsed,
        BigDecimal laborHours,
        BigDecimal equipmentHours,
        WeatherImpact weatherImpact,
        String weatherImpactDisplayName,
        UUID submittedById,
        Instant createdAt,
        Instant updatedAt
) {
    public static DailyReportResponse fromEntity(DailyReport dr) {
        return new DailyReportResponse(
                dr.getId(),
                dr.getWorkOrderId(),
                dr.getReportDate(),
                dr.getWorkDone(),
                dr.getIssues(),
                dr.getMaterialsUsed(),
                dr.getLaborHours(),
                dr.getEquipmentHours(),
                dr.getWeatherImpact(),
                dr.getWeatherImpact() != null ? dr.getWeatherImpact().getDisplayName() : null,
                dr.getSubmittedById(),
                dr.getCreatedAt(),
                dr.getUpdatedAt()
        );
    }
}
