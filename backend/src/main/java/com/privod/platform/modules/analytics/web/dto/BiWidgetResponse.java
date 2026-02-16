package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.BiWidget;
import com.privod.platform.modules.analytics.domain.BiWidgetType;

import java.time.Instant;
import java.util.UUID;

public record BiWidgetResponse(
        UUID id,
        UUID dashboardId,
        BiWidgetType widgetType,
        String widgetTypeDisplayName,
        String title,
        String dataSource,
        String query,
        String config,
        String position,
        String size,
        int refreshIntervalSeconds,
        Instant createdAt,
        Instant updatedAt
) {
    public static BiWidgetResponse fromEntity(BiWidget widget) {
        return new BiWidgetResponse(
                widget.getId(),
                widget.getDashboardId(),
                widget.getWidgetType(),
                widget.getWidgetType().getDisplayName(),
                widget.getTitle(),
                widget.getDataSource(),
                widget.getQuery(),
                widget.getConfig(),
                widget.getPosition(),
                widget.getSize(),
                widget.getRefreshIntervalSeconds(),
                widget.getCreatedAt(),
                widget.getUpdatedAt()
        );
    }
}
