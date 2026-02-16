package com.privod.platform.modules.monteCarlo.web.dto;

import com.privod.platform.modules.monteCarlo.domain.MonteCarloSimulation;
import com.privod.platform.modules.monteCarlo.domain.SimulationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record MonteCarloSimulationResponse(
        UUID id,
        String name,
        UUID projectId,
        SimulationStatus status,
        String statusDisplayName,
        int iterations,
        BigDecimal confidenceLevel,
        Instant startedAt,
        Instant completedAt,
        Integer resultP50Duration,
        Integer resultP85Duration,
        Integer resultP95Duration,
        LocalDate resultP50Date,
        LocalDate resultP85Date,
        LocalDate resultP95Date,
        LocalDate baselineStartDate,
        Integer baselineDuration,
        String description,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MonteCarloSimulationResponse fromEntity(MonteCarloSimulation s) {
        return new MonteCarloSimulationResponse(
                s.getId(),
                s.getName(),
                s.getProjectId(),
                s.getStatus(),
                s.getStatus().getDisplayName(),
                s.getIterations(),
                s.getConfidenceLevel(),
                s.getStartedAt(),
                s.getCompletedAt(),
                s.getResultP50Duration(),
                s.getResultP85Duration(),
                s.getResultP95Duration(),
                s.getResultP50Date(),
                s.getResultP85Date(),
                s.getResultP95Date(),
                s.getBaselineStartDate(),
                s.getBaselineDuration(),
                s.getDescription(),
                s.getCreatedAt(),
                s.getUpdatedAt(),
                s.getCreatedBy()
        );
    }
}
