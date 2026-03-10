package com.privod.platform.modules.closing.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record GenerateKs2FromEstimateRequest(
        @NotNull(message = "ID сметы обязателен")
        UUID estimateId,

        UUID contractId,

        LocalDate documentDate,

        @NotNull(message = "Начало отчётного периода обязательно")
        LocalDate periodFrom,

        @NotNull(message = "Конец отчётного периода обязателен")
        LocalDate periodTo,

        @NotNull(message = "Процент выполнения обязателен")
        @DecimalMin(value = "0.01", message = "Процент выполнения должен быть больше 0")
        @DecimalMax(value = "100.00", message = "Процент выполнения не может превышать 100")
        BigDecimal completionPercent
) {
}
