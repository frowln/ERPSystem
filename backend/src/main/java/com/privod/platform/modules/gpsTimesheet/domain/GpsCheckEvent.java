package com.privod.platform.modules.gpsTimesheet.domain;

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
import org.hibernate.annotations.Filter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "gps_check_events", indexes = {
        @Index(name = "idx_gps_check_events_org", columnList = "organization_id"),
        @Index(name = "idx_gps_check_events_employee", columnList = "employee_id, recorded_at"),
        @Index(name = "idx_gps_check_events_project", columnList = "project_id"),
        @Index(name = "idx_gps_check_events_type", columnList = "employee_id, event_type")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GpsCheckEvent extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "site_geofence_id")
    private UUID siteGeofenceId;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 20)
    private CheckEventType eventType;

    @Column(name = "latitude", nullable = false)
    private double latitude;

    @Column(name = "longitude", nullable = false)
    private double longitude;

    @Column(name = "accuracy_meters")
    private Double accuracyMeters;

    @Column(name = "is_within_geofence", nullable = false)
    @Builder.Default
    private boolean isWithinGeofence = false;

    @Column(name = "device_id", length = 255)
    private String deviceId;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;
}
