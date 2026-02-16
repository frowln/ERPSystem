package com.privod.platform.modules.dailylog.web.dto;

import com.privod.platform.modules.dailylog.domain.DailyLog;
import com.privod.platform.modules.dailylog.domain.DailyLogStatus;
import com.privod.platform.modules.dailylog.domain.WeatherCondition;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record DailyLogResponse(
        UUID id,
        String code,
        UUID projectId,
        LocalDate logDate,
        WeatherCondition weatherConditions,
        String weatherConditionsDisplayName,
        BigDecimal temperatureMin,
        BigDecimal temperatureMax,
        BigDecimal windSpeed,
        UUID shiftSupervisorId,
        String shiftSupervisorName,
        DailyLogStatus status,
        String statusDisplayName,
        String generalNotes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DailyLogResponse fromEntity(DailyLog entity) {
        return new DailyLogResponse(
                entity.getId(),
                entity.getCode(),
                entity.getProjectId(),
                entity.getLogDate(),
                entity.getWeatherConditions(),
                entity.getWeatherConditions().getDisplayName(),
                entity.getTemperatureMin(),
                entity.getTemperatureMax(),
                entity.getWindSpeed(),
                entity.getShiftSupervisorId(),
                entity.getShiftSupervisorName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getGeneralNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
