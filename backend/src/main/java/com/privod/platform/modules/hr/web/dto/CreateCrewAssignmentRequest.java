package com.privod.platform.modules.hr.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCrewAssignmentRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @Size(max = 200)
        String role,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        LocalDate endDate,

        BigDecimal hourlyRate
) {
}
