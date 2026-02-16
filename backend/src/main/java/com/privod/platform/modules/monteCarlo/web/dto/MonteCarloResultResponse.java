package com.privod.platform.modules.monteCarlo.web.dto;

import com.privod.platform.modules.monteCarlo.domain.MonteCarloResult;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record MonteCarloResultResponse(
        UUID id,
        UUID simulationId,
        int percentile,
        int durationDays,
        LocalDate completionDate,
        BigDecimal probability
) {
    public static MonteCarloResultResponse fromEntity(MonteCarloResult r) {
        return new MonteCarloResultResponse(
                r.getId(),
                r.getSimulationId(),
                r.getPercentile(),
                r.getDurationDays(),
                r.getCompletionDate(),
                r.getProbability()
        );
    }
}
