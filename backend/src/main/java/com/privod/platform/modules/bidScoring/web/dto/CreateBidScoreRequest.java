package com.privod.platform.modules.bidScoring.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateBidScoreRequest(
        @NotNull(message = "ID сравнения обязателен")
        UUID bidComparisonId,

        @NotNull(message = "ID критерия обязателен")
        UUID criteriaId,

        @NotNull(message = "ID поставщика обязателен")
        UUID vendorId,

        @Size(max = 500)
        String vendorName,

        @NotNull(message = "Оценка обязательна")
        @DecimalMin(value = "0", message = "Оценка не может быть отрицательной")
        BigDecimal score,

        String comments,

        UUID scoredById
) {
}
