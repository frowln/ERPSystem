package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.QualityRating;
import com.privod.platform.modules.specification.domain.SubstitutionType;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateMaterialAnalogRequest(
        @Size(max = 500, message = "Наименование оригинального материала не должно превышать 500 символов")
        String originalMaterialName,

        @Size(max = 500, message = "Наименование аналога не должно превышать 500 символов")
        String analogMaterialName,

        SubstitutionType substitutionType,
        BigDecimal priceRatio,
        QualityRating qualityRating,
        String conditions,
        Boolean isActive
) {
}
