package com.privod.platform.modules.dailylog.web.dto;

import com.privod.platform.modules.dailylog.domain.WeatherCondition;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateDailyLogRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата журнала обязательна")
        LocalDate logDate,

        @NotNull(message = "Погодные условия обязательны")
        WeatherCondition weatherConditions,

        BigDecimal temperatureMin,
        BigDecimal temperatureMax,
        BigDecimal windSpeed,
        UUID shiftSupervisorId,
        String shiftSupervisorName,
        String generalNotes
) {
}
