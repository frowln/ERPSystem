package com.privod.platform.modules.monteCarlo.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

import java.util.UUID;

public record RunSimulationRequest(
        UUID simulationId,
        @Min(100) @Max(100000) Integer iterations
) {
    public int resolvedIterations() {
        return iterations != null ? iterations : 10000;
    }
}
