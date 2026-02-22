package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.SafetyRiskLevel;

import java.util.List;
import java.util.UUID;

public record PortfolioRiskMapResponse(
        List<ProjectRisk> projects,
        int avgScore,
        SafetyRiskLevel overallLevel,
        String overallLevelDisplayName,
        int criticalCount,
        int highCount
) {

    public record ProjectRisk(
            UUID projectId,
            String projectName,
            int score,
            SafetyRiskLevel level,
            String levelDisplayName,
            String levelColor,
            int incidentCount,
            int violationCount
    ) {
    }
}
