package com.privod.platform.modules.revenueRecognition.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateRecognitionPeriodRequest(
        @NotNull(message = "Идентификатор договора признания выручки обязателен")
        UUID revenueContractId,

        @NotNull(message = "Дата начала периода обязательна")
        LocalDate periodStart,

        @NotNull(message = "Дата окончания периода обязательна")
        LocalDate periodEnd,

        BigDecimal cumulativeCostIncurred,

        String notes
) {
}
