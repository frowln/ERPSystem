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

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "gps_timesheet_entries", indexes = {
        @Index(name = "idx_gps_ts_entries_org", columnList = "organization_id"),
        @Index(name = "idx_gps_ts_entries_employee", columnList = "employee_id, work_date"),
        @Index(name = "idx_gps_ts_entries_project", columnList = "project_id"),
        @Index(name = "idx_gps_ts_entries_verified", columnList = "organization_id, is_verified"),
        @Index(name = "idx_gps_ts_entries_date", columnList = "work_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GpsTimesheetEntry extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "check_in_event_id")
    private UUID checkInEventId;

    @Column(name = "check_out_event_id")
    private UUID checkOutEventId;

    @Column(name = "work_date", nullable = false)
    private LocalDate workDate;

    @Column(name = "check_in_time")
    private Instant checkInTime;

    @Column(name = "check_out_time")
    private Instant checkOutTime;

    @Column(name = "total_hours", precision = 6, scale = 2)
    private BigDecimal totalHours;

    @Column(name = "is_verified", nullable = false)
    @Builder.Default
    private boolean isVerified = false;

    @Column(name = "is_geofence_verified", nullable = false)
    @Builder.Default
    private boolean isGeofenceVerified = false;

    @Column(name = "cost_code_id")
    private UUID costCodeId;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
