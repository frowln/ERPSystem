package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.Dashboard;
import com.privod.platform.modules.analytics.domain.DashboardType;

import java.time.Instant;
import java.util.UUID;

public record DashboardResponse(
        UUID id,
        String code,
        String name,
        String description,
        UUID ownerId,
        DashboardType dashboardType,
        String dashboardTypeDisplayName,
        String layoutConfig,
        boolean isDefault,
        boolean isPublic,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DashboardResponse fromEntity(Dashboard dashboard) {
        return new DashboardResponse(
                dashboard.getId(),
                dashboard.getCode(),
                dashboard.getName(),
                dashboard.getDescription(),
                dashboard.getOwnerId(),
                dashboard.getDashboardType(),
                dashboard.getDashboardType().getDisplayName(),
                dashboard.getLayoutConfig(),
                dashboard.isDefault(),
                dashboard.isPublic(),
                dashboard.getCreatedAt(),
                dashboard.getUpdatedAt(),
                dashboard.getCreatedBy()
        );
    }
}
