package com.privod.platform.modules.analytics.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateBonusCalculationRequest(
        @NotNull(message = "ID сотрудника обязателен")
        UUID employeeId,

        String employeeName,

        @NotBlank(message = "Период обязателен")
        String period,

        BigDecimal baseBonus,
        BigDecimal kpiMultiplier,
        BigDecimal finalBonus
) {
}
