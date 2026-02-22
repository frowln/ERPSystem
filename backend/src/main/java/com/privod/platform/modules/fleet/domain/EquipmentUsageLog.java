package com.privod.platform.modules.fleet.domain;

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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "equipment_usage_logs", indexes = {
        @Index(name = "idx_usage_log_org", columnList = "organization_id"),
        @Index(name = "idx_usage_log_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_usage_log_project", columnList = "project_id"),
        @Index(name = "idx_usage_log_date", columnList = "usage_date"),
        @Index(name = "idx_usage_log_org_vehicle_date", columnList = "organization_id, vehicle_id, usage_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentUsageLog extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "operator_id")
    private UUID operatorId;

    @Column(name = "operator_name", length = 255)
    private String operatorName;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(name = "hours_worked", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal hoursWorked = BigDecimal.ZERO;

    @Column(name = "hours_start", precision = 12, scale = 2)
    private BigDecimal hoursStart;

    @Column(name = "hours_end", precision = 12, scale = 2)
    private BigDecimal hoursEnd;

    @Column(name = "fuel_consumed", precision = 10, scale = 2)
    private BigDecimal fuelConsumed;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
