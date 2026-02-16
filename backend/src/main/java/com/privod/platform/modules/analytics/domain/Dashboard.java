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
@Table(name = "dashboards", indexes = {
        @Index(name = "idx_dashboard_code", columnList = "code", unique = true),
        @Index(name = "idx_dashboard_owner", columnList = "owner_id"),
        @Index(name = "idx_dashboard_type", columnList = "dashboard_type")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Dashboard extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 100)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Enumerated(EnumType.STRING)
    @Column(name = "dashboard_type", nullable = false, length = 20)
    @Builder.Default
    private DashboardType dashboardType = DashboardType.PERSONAL;

    @Column(name = "layout_config", columnDefinition = "JSONB")
    @Builder.Default
    private String layoutConfig = "{}";

    @Column(name = "is_default", nullable = false)
    @Builder.Default
    private boolean isDefault = false;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private boolean isPublic = false;
}
