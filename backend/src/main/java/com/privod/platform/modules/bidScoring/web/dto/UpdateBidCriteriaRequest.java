package com.privod.platform.modules.bidScoring.web.dto;

import com.privod.platform.modules.bidScoring.domain.CriteriaType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateBidCriteriaRequest(
        CriteriaType criteriaType,

        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        @DecimalMin(value = "0", message = "Вес не может быть отрицательным")
        @DecimalMax(value = "100", message = "Вес не может превышать 100")
        BigDecimal weight,

        @Min(value = 1, message = "Максимальный балл должен быть больше 0")
        Integer maxScore,

        Integer sortOrder
) {
}
