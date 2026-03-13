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
        BigDecimal workedHours,

        // ст.154 ТК РФ — часы работы в ночное время (22:00–06:00) за расчётный период
        @DecimalMin(value = "0", message = "Ночные часы не могут быть отрицательными")
        BigDecimal nightHours,

        // ст.153 ТК РФ — часы работы в праздничные и выходные дни за расчётный период
        @DecimalMin(value = "0", message = "Праздничные/выходные часы не могут быть отрицательными")
        BigDecimal holidayHours,

        // P0-4: Budget.id проекта — при утверждении расчёта gross_pay пишется в BudgetItem(LABOR)
        UUID budgetId
) {
}
