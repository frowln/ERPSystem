package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.DayType;
import com.privod.platform.modules.calendar.domain.WorkCalendarDay;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record WorkCalendarDayResponse(
        UUID id,
        UUID calendarId,
        LocalDate calendarDate,
        DayType dayType,
        String dayTypeDisplayName,
        BigDecimal workHours,
        String note
) {
    public static WorkCalendarDayResponse fromEntity(WorkCalendarDay day) {
        return new WorkCalendarDayResponse(
                day.getId(),
                day.getCalendarId(),
                day.getCalendarDate(),
                day.getDayType(),
                day.getDayType().getDisplayName(),
                day.getWorkHours(),
                day.getNote()
        );
    }
}
