package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.BiDashboard;

import java.time.Instant;
import java.util.UUID;

public record BiDashboardResponse(
        UUID id,
        String name,
        String description,
        String layout,
        boolean isDefault,
        UUID ownerId,
        boolean isShared,
        int refreshIntervalSeconds,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static BiDashboardResponse fromEntity(BiDashboard dashboard) {
        return new BiDashboardResponse(
                dashboard.getId(),
                dashboard.getName(),
                dashboard.getDescription(),
                dashboard.getLayout(),
                dashboard.isDefault(),
                dashboard.getOwnerId(),
                dashboard.isShared(),
                dashboard.getRefreshIntervalSeconds(),
                dashboard.getCreatedAt(),
                dashboard.getUpdatedAt(),
                dashboard.getCreatedBy()
        );
    }
}
