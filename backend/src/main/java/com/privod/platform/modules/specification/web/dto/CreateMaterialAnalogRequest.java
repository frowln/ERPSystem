package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.QualityRating;
import com.privod.platform.modules.specification.domain.SubstitutionType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateMaterialAnalogRequest(
        @NotNull(message = "Идентификатор оригинального материала обязателен")
        UUID originalMaterialId,

        @Size(max = 500, message = "Наименование оригинального материала не должно превышать 500 символов")
        String originalMaterialName,

        @NotNull(message = "Идентификатор аналога обязателен")
        UUID analogMaterialId,

        @Size(max = 500, message = "Наименование аналога не должно превышать 500 символов")
        String analogMaterialName,

        @NotNull(message = "Тип замены обязателен")
        SubstitutionType substitutionType,

        BigDecimal priceRatio,

        @NotNull(message = "Оценка качества обязательна")
        QualityRating qualityRating,

        String conditions
) {
}
