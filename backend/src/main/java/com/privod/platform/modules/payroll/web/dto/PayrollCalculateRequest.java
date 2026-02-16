package com.privod.platform.modules.payroll.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record PayrollCalculateRequest(
        @NotNull(message = "ID шаблона обязателен")
        UUID templateId,

        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotNull(message = "Начало периода обязательно")
        LocalDate periodStart,

        @NotNull(message = "Конец периода обязателен")
        LocalDate periodEnd,

        @DecimalMin(value = "0", message = "Количество сверхурочных часов не может быть отрицательным")
        BigDecimal overtimeHours,

        @DecimalMin(value = "0", message = "Количество рабочих часов не может быть отрицательным")
        BigDecimal workedHours
) {
}
