package com.privod.platform.modules.gpsTimesheet.domain;

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
import org.hibernate.annotations.Filter;

import java.util.UUID;

@Entity
@Table(name = "site_geofences", indexes = {
        @Index(name = "idx_site_geofences_org", columnList = "organization_id"),
        @Index(name = "idx_site_geofences_project", columnList = "project_id"),
        @Index(name = "idx_site_geofences_active", columnList = "organization_id, is_active")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SiteGeofence extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "center_latitude", nullable = false)
    private double centerLatitude;

    @Column(name = "center_longitude", nullable = false)
    private double centerLongitude;

    @Column(name = "radius_meters", nullable = false)
    @Builder.Default
    private double radiusMeters = 100.0;

    @Column(name = "polygon_json", columnDefinition = "TEXT")
    private String polygonJson;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
