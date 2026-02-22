package com.privod.platform.modules.gpsTimesheet.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "gps_timesheet_summaries", indexes = {
        @Index(name = "idx_gps_ts_summaries_org", columnList = "organization_id"),
        @Index(name = "idx_gps_ts_summaries_employee", columnList = "employee_id, period_year, period_month"),
        @Index(name = "idx_gps_ts_summaries_period", columnList = "organization_id, period_year, period_month")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_gps_ts_summary",
                columnNames = {"organization_id", "employee_id", "period_year", "period_month"})
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GpsTimesheetSummary extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "employee_id", nullable = false)
    private UUID employeeId;

    @Column(name = "period_year", nullable = false)
    private int periodYear;

    @Column(name = "period_month", nullable = false)
    private int periodMonth;

    @Column(name = "total_days", nullable = false)
    @Builder.Default
    private int totalDays = 0;

    @Column(name = "total_hours", nullable = false, precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal totalHours = BigDecimal.ZERO;

    @Column(name = "verified_hours", nullable = false, precision = 8, scale = 2)
    @Builder.Default
    private BigDecimal verifiedHours = BigDecimal.ZERO;

    @Column(name = "geofence_violations", nullable = false)
    @Builder.Default
    private int geofenceViolations = 0;
}
