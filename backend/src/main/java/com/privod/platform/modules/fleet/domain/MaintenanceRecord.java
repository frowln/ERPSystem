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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "maintenance_records", indexes = {
        @Index(name = "idx_maintenance_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_maintenance_type", columnList = "maintenance_type"),
        @Index(name = "idx_maintenance_status", columnList = "status"),
        @Index(name = "idx_maintenance_next_date", columnList = "next_service_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceRecord extends BaseEntity {

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Enumerated(EnumType.STRING)
    @Column(name = "maintenance_type", nullable = false, length = 30)
    private MaintenanceType maintenanceType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private MaintenanceStatus status = MaintenanceStatus.PLANNED;

    @Column(name = "cost", precision = 18, scale = 2)
    private BigDecimal cost;

    @Column(name = "performed_by_id")
    private UUID performedById;

    @Column(name = "vendor", length = 300)
    private String vendor;

    @Column(name = "mileage_at_service", precision = 12, scale = 2)
    private BigDecimal mileageAtService;

    @Column(name = "hours_at_service", precision = 12, scale = 2)
    private BigDecimal hoursAtService;

    @Column(name = "next_service_mileage", precision = 12, scale = 2)
    private BigDecimal nextServiceMileage;

    @Column(name = "next_service_hours", precision = 12, scale = 2)
    private BigDecimal nextServiceHours;

    @Column(name = "next_service_date")
    private LocalDate nextServiceDate;
}
