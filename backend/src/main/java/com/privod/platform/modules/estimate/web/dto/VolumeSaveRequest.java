package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.Map;
import java.util.UUID;

public record VolumeSaveRequest(
        UUID id,
        @NotBlank String workType,
        Map<String, Double> params,
        double result,
        String unit,
        UUID linkedEstimateItemId
) {}
