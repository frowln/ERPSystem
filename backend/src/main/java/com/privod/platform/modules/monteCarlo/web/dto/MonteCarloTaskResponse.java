package com.privod.platform.modules.monteCarlo.web.dto;

import com.privod.platform.modules.monteCarlo.domain.DistributionType;
import com.privod.platform.modules.monteCarlo.domain.MonteCarloTask;

import java.time.Instant;
import java.util.UUID;

public record MonteCarloTaskResponse(
        UUID id,
        UUID simulationId,
        String taskName,
        UUID wbsNodeId,
        int optimisticDuration,
        int mostLikelyDuration,
        int pessimisticDuration,
        DistributionType distribution,
        String distributionDisplayName,
        String dependencies,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MonteCarloTaskResponse fromEntity(MonteCarloTask t) {
        return new MonteCarloTaskResponse(
                t.getId(),
                t.getSimulationId(),
                t.getTaskName(),
                t.getWbsNodeId(),
                t.getOptimisticDuration(),
                t.getMostLikelyDuration(),
                t.getPessimisticDuration(),
                t.getDistribution(),
                t.getDistribution().getDisplayName(),
                t.getDependencies(),
                t.getCreatedAt(),
                t.getUpdatedAt(),
                t.getCreatedBy()
        );
    }
}
