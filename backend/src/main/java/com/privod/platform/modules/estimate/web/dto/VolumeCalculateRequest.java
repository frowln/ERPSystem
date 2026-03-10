package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record VolumeCalculateRequest(
        @NotBlank String workType,
        @NotNull Map<String, Double> params
) {}
