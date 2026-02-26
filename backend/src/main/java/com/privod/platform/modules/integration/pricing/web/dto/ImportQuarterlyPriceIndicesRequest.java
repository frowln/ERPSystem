package com.privod.platform.modules.integration.pricing.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

public record ImportQuarterlyPriceIndicesRequest(
        @NotBlank(message = "Квартал обязателен")
        @Size(max = 20, message = "Квартал не должен превышать 20 символов")
        String quarter,

        @Size(max = 500, message = "Источник не должен превышать 500 символов")
        String source,

        @NotEmpty(message = "Список индексов не должен быть пустым")
        List<@Valid IndexEntry> entries
) {
    public record IndexEntry(
            @NotBlank(message = "Регион обязателен")
            @Size(max = 255, message = "Регион не должен превышать 255 символов")
            String region,

            @NotBlank(message = "Тип работ обязателен")
            @Size(max = 100, message = "Тип работ не должен превышать 100 символов")
            String workType,

            @Size(max = 20, message = "Базовый квартал не должен превышать 20 символов")
            String baseQuarter,

            @NotNull(message = "Значение индекса обязательно")
            BigDecimal indexValue
    ) {
    }
}
