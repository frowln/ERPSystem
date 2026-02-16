package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.AbcCategory;
import com.privod.platform.modules.analytics.domain.XyzCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateAbcXyzAnalysisRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата анализа обязательна")
        LocalDate analysisDate,

        @NotBlank(message = "Тип сущности обязателен")
        String entityType,

        @NotNull(message = "Идентификатор сущности обязателен")
        UUID entityId,

        @NotBlank(message = "Название сущности обязательно")
        String entityName,

        @NotNull(message = "Категория ABC обязательна")
        AbcCategory abcCategory,

        @NotNull(message = "Категория XYZ обязательна")
        XyzCategory xyzCategory,

        BigDecimal totalValue,
        BigDecimal percentOfTotal,
        BigDecimal variationCoefficient,
        Integer frequency
) {
}
