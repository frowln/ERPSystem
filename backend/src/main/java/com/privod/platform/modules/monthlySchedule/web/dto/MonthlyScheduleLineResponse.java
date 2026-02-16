package com.privod.platform.modules.monthlySchedule.web.dto;

import com.privod.platform.modules.monthlySchedule.domain.MonthlyScheduleLine;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MonthlyScheduleLineResponse(
        UUID id,
        UUID scheduleId,
        String workName,
        String unit,
        BigDecimal plannedVolume,
        BigDecimal actualVolume,
        LocalDate startDate,
        LocalDate endDate,
        String responsible,
        String notes,
        Instant createdAt,
        String createdBy
) {
    public static MonthlyScheduleLineResponse fromEntity(MonthlyScheduleLine entity) {
        return new MonthlyScheduleLineResponse(
                entity.getId(),
                entity.getScheduleId(),
                entity.getWorkName(),
                entity.getUnit(),
                entity.getPlannedVolume(),
                entity.getActualVolume(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getResponsible(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
