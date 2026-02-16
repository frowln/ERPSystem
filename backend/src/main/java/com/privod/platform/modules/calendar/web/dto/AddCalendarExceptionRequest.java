package com.privod.platform.modules.calendar.web.dto;

import com.privod.platform.modules.calendar.domain.DayType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record AddCalendarExceptionRequest(
        @NotNull(message = "Дата обязательна")
        LocalDate calendarDate,

        @NotNull(message = "Тип дня обязателен")
        DayType dayType,

        BigDecimal workHours,

        @Size(max = 500, message = "Примечание не должно превышать 500 символов")
        String note
) {
}
