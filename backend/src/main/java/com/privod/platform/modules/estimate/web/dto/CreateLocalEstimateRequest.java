package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.CalculationMethod;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

public record CreateLocalEstimateRequest(
        @NotBlank String name,
        UUID projectId,
        UUID contractId,
        String objectName,
        CalculationMethod calculationMethod,
        String region,
        Integer baseYear,
        String priceLevelQuarter
) {
}
