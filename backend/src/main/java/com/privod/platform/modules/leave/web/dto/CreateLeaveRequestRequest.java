package com.privod.platform.modules.leave.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateLeaveRequestRequest(

        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotNull(message = "ID типа отпуска обязателен")
        UUID leaveTypeId,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate endDate,

        @NotNull(message = "Количество дней обязательно")
        BigDecimal numberOfDays,

        String reason
) {
}
