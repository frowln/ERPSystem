package com.privod.platform.modules.calendar.web.dto;

import java.time.LocalDate;

public record WorkingDaysResponse(
        LocalDate startDate,
        LocalDate endDate,
        long workingDays,
        long totalDays
) {
}
