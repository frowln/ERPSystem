package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.VolumeCalculation;

import java.math.BigDecimal;
import java.util.Map;
import java.util.UUID;

public record VolumeCalculationResponse(
        UUID id,
        String workType,
        Map<String, Double> params,
        double result,
        String unit,
        UUID linkedEstimateItemId
) {
    public static VolumeCalculationResponse fromEntity(VolumeCalculation entity, Map<String, Double> parsedParams) {
        return new VolumeCalculationResponse(
                entity.getId(),
                entity.getWorkType(),
                parsedParams,
                entity.getResult() != null ? entity.getResult().doubleValue() : 0.0,
                entity.getUnit(),
                entity.getLinkedEstimateItemId()
        );
    }
}
