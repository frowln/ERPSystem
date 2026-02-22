package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.RiskFactorType;
import com.privod.platform.modules.safety.domain.SafetyRiskFactor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SafetyRiskFactorResponse(
        UUID id,
        UUID projectId,
        RiskFactorType factorType,
        String factorTypeDisplayName,
        BigDecimal weight,
        BigDecimal rawValue,
        BigDecimal normalizedValue,
        String description,
        Instant calculatedAt
) {
    public static SafetyRiskFactorResponse fromEntity(SafetyRiskFactor factor) {
        return new SafetyRiskFactorResponse(
                factor.getId(),
                factor.getProjectId(),
                factor.getFactorType(),
                factor.getFactorType().getDisplayName(),
                factor.getWeight(),
                factor.getRawValue(),
                factor.getNormalizedValue(),
                factor.getDescription(),
                factor.getCalculatedAt()
        );
    }
}
