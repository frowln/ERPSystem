package com.privod.platform.modules.priceCoefficient.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CalculatePriceRequest(
        @NotNull(message = "Исходная цена обязательна")
        @DecimalMin(value = "0", message = "Исходная цена не может быть отрицательной")
        BigDecimal originalPrice,

        UUID projectId,

        UUID contractId,

        LocalDate effectiveDate,

        List<UUID> coefficientIds
) {
}
