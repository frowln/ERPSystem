package com.privod.platform.modules.analytics.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "dashboard_widgets", indexes = {
        @Index(name = "idx_widget_dashboard", columnList = "dashboard_id"),
        @Index(name = "idx_widget_type", columnList = "widget_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardWidget extends BaseEntity {

    @Column(name = "dashboard_id", nullable = false)
    private UUID dashboardId;

    @Enumerated(EnumType.STRING)
    @Column(name = "widget_type", nullable = false, length = 30)
    private WidgetType widgetType;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "data_source", nullable = false, length = 255)
    private String dataSource;

    @Column(name = "config_json", columnDefinition = "JSONB")
    @Builder.Default
    private String configJson = "{}";

    @Column(name = "position_x", nullable = false)
    @Builder.Default
    private Integer positionX = 0;

    @Column(name = "position_y", nullable = false)
    @Builder.Default
    private Integer positionY = 0;

    @Column(name = "width", nullable = false)
    @Builder.Default
    private Integer width = 4;

    @Column(name = "height", nullable = false)
    @Builder.Default
    private Integer height = 3;

    @Column(name = "refresh_interval_seconds")
    @Builder.Default
    private Integer refreshIntervalSeconds = 300;
}
