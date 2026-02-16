package com.privod.platform.modules.integration.pricing.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreatePriceIndexRequest(
        @NotBlank(message = "Регион обязателен")
        @Size(max = 255, message = "Регион не должен превышать 255 символов")
        String region,

        @NotBlank(message = "Тип работ обязателен")
        @Size(max = 100, message = "Тип работ не должен превышать 100 символов")
        String workType,

        @NotBlank(message = "Базовый квартал обязателен")
        @Size(max = 20, message = "Квартал не должен превышать 20 символов")
        String baseQuarter,

        @NotBlank(message = "Целевой квартал обязателен")
        @Size(max = 20, message = "Квартал не должен превышать 20 символов")
        String targetQuarter,

        @NotNull(message = "Значение индекса обязательно")
        BigDecimal indexValue,

        @Size(max = 500, message = "Источник не должен превышать 500 символов")
        String source
) {
}
