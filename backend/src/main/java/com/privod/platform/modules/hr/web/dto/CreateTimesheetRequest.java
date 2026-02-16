package com.privod.platform.modules.hr.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateTimesheetRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата работы обязательна")
        LocalDate workDate,

        @NotNull(message = "Количество часов обязательно")
        @DecimalMin(value = "0.01", message = "Количество часов должно быть больше 0")
        BigDecimal hoursWorked,

        @DecimalMin(value = "0", message = "Сверхурочные часы не могут быть отрицательными")
        BigDecimal overtimeHours,

        String notes
) {
}
