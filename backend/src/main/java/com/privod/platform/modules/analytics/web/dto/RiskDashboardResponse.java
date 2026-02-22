package com.privod.platform.modules.analytics.web.dto;

import java.util.List;

public record RiskDashboardResponse(
        int totalProjects,
        int highRiskProjects,
        int mediumRiskProjects,
        int lowRiskProjects,
        int activeAlerts,
        List<RiskHeatmapEntry> heatmap,
        List<ProjectRiskPredictionResponse> topRisks
) {
}
