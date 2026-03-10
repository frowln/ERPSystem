package com.privod.platform.modules.admin.web.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DashboardMetricsResponse(
    long totalUsers,
    long totalProjects,
    long storageUsedMb,
    boolean systemHealthy,
    List<RecentAction> recentActions
) {
    public record RecentAction(
        UUID id,
        String entityType,
        String action,
        String userName,
        Instant timestamp
    ) {}
}
