package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.RiskFactorCategory;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateRiskFactorWeightRequest(
        @Size(max = 200) String factorName,
        RiskFactorCategory factorCategory,
        BigDecimal weightValue,
        String description
) {
}
