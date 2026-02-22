package com.privod.platform.modules.fleet.domain;

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

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "maintenance_schedule_rules", indexes = {
        @Index(name = "idx_sched_rule_org", columnList = "organization_id"),
        @Index(name = "idx_sched_rule_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_sched_rule_active", columnList = "organization_id, is_active")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceScheduleRule extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false, length = 30)
    @Builder.Default
    private MaintenanceType maintenanceType = MaintenanceType.SCHEDULED;

    @Column(name = "interval_hours", precision = 10, scale = 2)
    private BigDecimal intervalHours;

    @Column(name = "interval_mileage", precision = 12, scale = 2)
    private BigDecimal intervalMileage;

    @Column(name = "interval_days")
    private Integer intervalDays;

    @Column(name = "lead_time_hours", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal leadTimeHours = new BigDecimal("50");

    @Column(name = "lead_time_mileage", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal leadTimeMileage = new BigDecimal("500");

    @Column(name = "lead_time_days")
    @Builder.Default
    private Integer leadTimeDays = 7;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "applies_to_all_vehicles")
    @Builder.Default
    private Boolean appliesToAllVehicles = false;

    @Column(name = "last_triggered_at")
    private Instant lastTriggeredAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
