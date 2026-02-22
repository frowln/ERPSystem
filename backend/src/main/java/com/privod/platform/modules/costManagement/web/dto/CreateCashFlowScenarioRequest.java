package com.privod.platform.modules.costManagement.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCashFlowScenarioRequest(
        UUID projectId,

        @NotBlank(message = "Наименование сценария обязательно")
        @Size(max = 300, message = "Наименование не должно превышать 300 символов")
        String name,

        String description,

        LocalDate baselineDate,

        Integer horizonMonths,

        BigDecimal growthRatePercent,

        Integer paymentDelayDays,

        BigDecimal retentionPercent,

        Boolean includeVat
) {
}
