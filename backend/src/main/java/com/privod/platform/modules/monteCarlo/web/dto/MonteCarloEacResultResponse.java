package com.privod.platform.modules.monteCarlo.web.dto;

import com.privod.platform.modules.monteCarlo.domain.MonteCarloEacResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MonteCarloEacResultResponse(
        UUID id,
        UUID organizationId,
        UUID simulationId,
        UUID projectId,
        int iterations,
        // Cost forecasts
        BigDecimal costP10,
        BigDecimal costP50,
        BigDecimal costP90,
        BigDecimal costMean,
        BigDecimal costStdDev,
        // Schedule forecasts
        Integer scheduleP10,
        Integer scheduleP50,
        Integer scheduleP90,
        BigDecimal scheduleMean,
        // EAC trajectory
        String eacTrajectoryJson,
        // TCPI
        BigDecimal tcpiBac,
        BigDecimal tcpiEac,
        // Confidence bands
        String confidenceBandsJson,
        // Insights
        String insightsJson,
        // Histograms
        String costHistogramJson,
        String scheduleHistogramJson,
        // Timestamps
        Instant calculatedAt,
        Instant createdAt
) {
    public static MonteCarloEacResultResponse fromEntity(MonteCarloEacResult r) {
        return new MonteCarloEacResultResponse(
                r.getId(),
                r.getOrganizationId(),
                r.getSimulationId(),
                r.getProjectId(),
                r.getIterations(),
                r.getCostP10(),
                r.getCostP50(),
                r.getCostP90(),
                r.getCostMean(),
                r.getCostStdDev(),
                r.getScheduleP10(),
                r.getScheduleP50(),
                r.getScheduleP90(),
                r.getScheduleMean(),
                r.getEacTrajectoryJson(),
                r.getTcpiBac(),
                r.getTcpiEac(),
                r.getConfidenceBandsJson(),
                r.getInsightsJson(),
                r.getCostHistogramJson(),
                r.getScheduleHistogramJson(),
                r.getCalculatedAt(),
                r.getCreatedAt()
        );
    }
}
