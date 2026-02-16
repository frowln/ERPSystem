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
@Table(name = "bi_widgets", indexes = {
        @Index(name = "idx_bi_widget_dashboard", columnList = "dashboard_id"),
        @Index(name = "idx_bi_widget_type", columnList = "widget_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiWidget extends BaseEntity {

    @Column(name = "dashboard_id", nullable = false)
    private UUID dashboardId;

    @Enumerated(EnumType.STRING)
    @Column(name = "widget_type", nullable = false, length = 20)
    private BiWidgetType widgetType;

    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "data_source", nullable = false, length = 255)
    private String dataSource;

    @Column(name = "query", columnDefinition = "TEXT")
    private String query;

    @Column(name = "config", columnDefinition = "JSONB")
    @Builder.Default
    private String config = "{}";

    @Column(name = "position", columnDefinition = "JSONB")
    @Builder.Default
    private String position = "{}";

    @Column(name = "size", columnDefinition = "JSONB")
    @Builder.Default
    private String size = "{}";

    @Column(name = "refresh_interval_seconds")
    @Builder.Default
    private int refreshIntervalSeconds = 300;
}
