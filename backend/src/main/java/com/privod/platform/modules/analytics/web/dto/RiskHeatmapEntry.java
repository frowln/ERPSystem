package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record RiskHeatmapEntry(
        UUID projectId,
        String projectName,
        BigDecimal delayProbability,
        BigDecimal costOverrunProbability,
        BigDecimal qualityRiskProbability,
        String overallRiskLevel,
        int activeAlertCount
) {
}
