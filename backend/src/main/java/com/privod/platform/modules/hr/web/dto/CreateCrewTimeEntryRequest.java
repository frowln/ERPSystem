package com.privod.platform.modules.hr.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCrewTimeEntryRequest(
        @NotNull(message = "ID бригады обязателен")
        UUID crewId,

        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата работы обязательна")
        LocalDate workDate,

        @NotNull(message = "Количество часов обязательно")
        BigDecimal hoursWorked,

        BigDecimal overtimeHours,
        String activityType,
        String notes
) {
}
