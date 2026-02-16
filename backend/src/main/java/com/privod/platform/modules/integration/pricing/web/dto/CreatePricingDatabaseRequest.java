package com.privod.platform.modules.integration.pricing.web.dto;

import com.privod.platform.modules.integration.pricing.domain.PricingDatabaseType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreatePricingDatabaseRequest(
        @NotBlank(message = "Название обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @NotNull(message = "Тип базы обязателен")
        PricingDatabaseType type,

        @Size(max = 255, message = "Регион не должен превышать 255 символов")
        String region,

        @NotNull(message = "Базовый год обязателен")
        Integer baseYear,

        BigDecimal coefficientToCurrentPrices,

        LocalDate effectiveFrom,

        LocalDate effectiveTo,

        @Size(max = 1000, message = "URL источника не должен превышать 1000 символов")
        String sourceUrl,

        Boolean active
) {
}
