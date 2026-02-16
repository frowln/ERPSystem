package com.privod.platform.modules.monitoring.web.dto;

import java.util.List;

public record DashboardMetricsResponse(
        List<SystemMetricResponse> latestMetrics,
        List<String> availableMetricNames
) {
}
