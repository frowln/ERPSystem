package com.privod.platform.modules.dailylog.web.dto;

import com.privod.platform.modules.dailylog.domain.WeatherCondition;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateDailyLogRequest(
        WeatherCondition weatherConditions,
        BigDecimal temperatureMin,
        BigDecimal temperatureMax,
        BigDecimal windSpeed,
        UUID shiftSupervisorId,
        String shiftSupervisorName,
        String generalNotes
) {
}
