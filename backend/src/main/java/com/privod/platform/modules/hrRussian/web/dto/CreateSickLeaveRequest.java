package com.privod.platform.modules.hrRussian.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateSickLeaveRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate endDate,

        @Size(max = 50)
        String sickLeaveNumber,

        @Size(max = 500)
        String diagnosis,

        boolean extension,

        UUID previousSickLeaveId,

        BigDecimal paymentAmount
) {
}
