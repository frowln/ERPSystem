package com.privod.platform.modules.hrRussian.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateBusinessTripRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        @NotBlank(message = "Место назначения обязательно")
        @Size(max = 500)
        String destination,

        @NotBlank(message = "Цель командировки обязательна")
        String purpose,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate endDate,

        BigDecimal dailyAllowance,

        BigDecimal totalBudget,

        UUID orderId
) {
}
