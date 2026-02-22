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
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Путевой лист (vehicle trip waybill) per Prikaz Mintransa 390/159.
 */
@Entity
@Table(name = "fleet_waybills", indexes = {
        @Index(name = "idx_fleet_waybill_org", columnList = "organization_id"),
        @Index(name = "idx_fleet_waybill_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_fleet_waybill_date", columnList = "waybill_date"),
        @Index(name = "idx_fleet_waybill_status", columnList = "status"),
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FleetWaybill extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "number", nullable = false, length = 50)
    private String number;

    @Column(name = "waybill_date", nullable = false)
    private LocalDate waybillDate;

    // Driver
    @Column(name = "driver_id")
    private UUID driverId;

    @Column(name = "driver_name")
    private String driverName;

    // Route
    @Column(name = "route_description", columnDefinition = "TEXT")
    private String routeDescription;

    @Column(name = "departure_point", length = 500)
    private String departurePoint;

    @Column(name = "destination_point", length = 500)
    private String destinationPoint;

    // Time
    @Column(name = "departure_time")
    private Instant departureTime;

    @Column(name = "return_time")
    private Instant returnTime;

    // Mileage
    @Column(name = "mileage_start", precision = 12, scale = 2)
    private BigDecimal mileageStart;

    @Column(name = "mileage_end", precision = 12, scale = 2)
    private BigDecimal mileageEnd;

    // Engine hours
    @Column(name = "engine_hours_start", precision = 12, scale = 2)
    private BigDecimal engineHoursStart;

    @Column(name = "engine_hours_end", precision = 12, scale = 2)
    private BigDecimal engineHoursEnd;

    // Fuel
    @Column(name = "fuel_dispensed", precision = 10, scale = 2)
    private BigDecimal fuelDispensed;

    @Column(name = "fuel_consumed", precision = 10, scale = 2)
    private BigDecimal fuelConsumed;

    @Column(name = "fuel_norm", precision = 10, scale = 2)
    private BigDecimal fuelNorm;

    @Column(name = "fuel_remaining", precision = 10, scale = 2)
    private BigDecimal fuelRemaining;

    // Pre-trip checks
    @Column(name = "medical_exam_passed")
    @Builder.Default
    private Boolean medicalExamPassed = false;

    @Column(name = "medical_exam_time")
    private Instant medicalExamTime;

    @Column(name = "medical_examiner")
    private String medicalExaminer;

    @Column(name = "mechanic_approved")
    @Builder.Default
    private Boolean mechanicApproved = false;

    @Column(name = "mechanic_name")
    private String mechanicName;

    @Column(name = "mechanic_check_time")
    private Instant mechanicCheckTime;

    // Status
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private WaybillStatus status = WaybillStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    // ---- Computed helpers ----

    public BigDecimal getDistance() {
        if (mileageStart != null && mileageEnd != null) {
            return mileageEnd.subtract(mileageStart);
        }
        return null;
    }

    public BigDecimal getEngineHoursWorked() {
        if (engineHoursStart != null && engineHoursEnd != null) {
            return engineHoursEnd.subtract(engineHoursStart);
        }
        return null;
    }

    public BigDecimal getFuelVariancePercent() {
        if (fuelConsumed != null && fuelNorm != null && fuelNorm.compareTo(BigDecimal.ZERO) > 0) {
            return fuelConsumed.subtract(fuelNorm)
                    .divide(fuelNorm, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP);
        }
        return null;
    }
}
