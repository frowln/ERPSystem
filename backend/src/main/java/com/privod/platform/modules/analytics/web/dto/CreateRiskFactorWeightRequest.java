package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.RiskFactorCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CreateRiskFactorWeightRequest(
        @NotBlank @Size(max = 200) String factorName,
        @NotNull RiskFactorCategory factorCategory,
        BigDecimal weightValue,
        String description
) {
}
