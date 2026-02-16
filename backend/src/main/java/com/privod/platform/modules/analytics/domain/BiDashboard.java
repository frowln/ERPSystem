package com.privod.platform.modules.analytics.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "bi_dashboards", indexes = {
        @Index(name = "idx_bi_dashboard_owner", columnList = "owner_id"),
        @Index(name = "idx_bi_dashboard_shared", columnList = "is_shared"),
        @Index(name = "idx_bi_dashboard_default", columnList = "is_default")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BiDashboard extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "layout", columnDefinition = "JSONB")
    @Builder.Default
    private String layout = "{}";

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "is_shared", nullable = false)
    @Builder.Default
    private boolean isShared = false;

    @Column(name = "refresh_interval_seconds")
    @Builder.Default
    private int refreshIntervalSeconds = 300;
}
