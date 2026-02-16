package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.DashboardWidget;
import com.privod.platform.modules.analytics.domain.WidgetType;

import java.time.Instant;
import java.util.UUID;

public record DashboardWidgetResponse(
        UUID id,
        UUID dashboardId,
        WidgetType widgetType,
        String widgetTypeDisplayName,
        String title,
        String dataSource,
        String configJson,
        Integer positionX,
        Integer positionY,
        Integer width,
        Integer height,
        Integer refreshIntervalSeconds,
        Instant createdAt,
        Instant updatedAt
) {
    public static DashboardWidgetResponse fromEntity(DashboardWidget widget) {
        return new DashboardWidgetResponse(
                widget.getId(),
                widget.getDashboardId(),
                widget.getWidgetType(),
                widget.getWidgetType().getDisplayName(),
                widget.getTitle(),
                widget.getDataSource(),
                widget.getConfigJson(),
                widget.getPositionX(),
                widget.getPositionY(),
                widget.getWidth(),
                widget.getHeight(),
                widget.getRefreshIntervalSeconds(),
                widget.getCreatedAt(),
                widget.getUpdatedAt()
        );
    }
}
