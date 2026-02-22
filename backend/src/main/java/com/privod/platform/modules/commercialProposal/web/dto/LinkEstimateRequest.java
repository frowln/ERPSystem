package com.privod.platform.modules.commercialProposal.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record LinkEstimateRequest(
        @NotNull(message = "ID позиции сметы обязателен")
        UUID estimateItemId,

        @DecimalMin(value = "0", message = "Торговый коэффициент не может быть отрицательным")
        BigDecimal tradingCoefficient
) {
}
