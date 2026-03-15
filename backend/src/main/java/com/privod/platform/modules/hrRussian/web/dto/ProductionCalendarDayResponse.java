package com.privod.platform.modules.hrRussian.web.dto;

import com.privod.platform.modules.hrRussian.domain.DayType;
import com.privod.platform.modules.hrRussian.domain.ProductionCalendar;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ProductionCalendarDayResponse(
        UUID id,
        LocalDate calendarDate,
        DayType dayType,
        BigDecimal standardHours,
        String description,
        int year
) {
    public static ProductionCalendarDayResponse fromEntity(ProductionCalendar entity) {
        return new ProductionCalendarDayResponse(
                entity.getId(),
                entity.getCalendarDate(),
                entity.getDayType(),
                entity.getStandardHours(),
                entity.getDescription(),
                entity.getYear()
        );
    }
}
