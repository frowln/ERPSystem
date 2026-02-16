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
@Table(name = "vehicles", indexes = {
        @Index(name = "idx_vehicle_code", columnList = "code", unique = true),
        @Index(name = "idx_vehicle_status", columnList = "status"),
        @Index(name = "idx_vehicle_type", columnList = "vehicle_type"),
        @Index(name = "idx_vehicle_project", columnList = "current_project_id"),
        @Index(name = "idx_vehicle_responsible", columnList = "responsible_id"),
        @Index(name = "idx_vehicle_insurance_expiry", columnList = "insurance_expiry_date"),
        @Index(name = "idx_vehicle_tech_inspection_expiry", columnList = "tech_inspection_expiry_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vehicle extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 20)
    private String code;

    @Column(name = "license_plate", length = 20)
    private String licensePlate;

    @Column(name = "make", length = 100)
    private String make;

    @Column(name = "model", length = 100)
    private String model;

    @Column(name = "year")
    private Integer year;

    @Column(name = "vin", length = 50)
    private String vin;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", nullable = false, length = 30)
    private VehicleType vehicleType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private VehicleStatus status = VehicleStatus.AVAILABLE;

    @Column(name = "current_project_id")
    private UUID currentProjectId;

    @Column(name = "current_location_id")
    private UUID currentLocationId;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "purchase_price", precision = 18, scale = 2)
    private BigDecimal purchasePrice;

    @Column(name = "current_value", precision = 18, scale = 2)
    private BigDecimal currentValue;

    @Column(name = "depreciation_rate", precision = 5, scale = 2)
    private BigDecimal depreciationRate;

    @Enumerated(EnumType.STRING)
    @Column(name = "fuel_type", length = 20)
    private FuelType fuelType;

    @Column(name = "fuel_consumption_rate", precision = 8, scale = 2)
    private BigDecimal fuelConsumptionRate;

    @Column(name = "current_mileage", precision = 12, scale = 2)
    private BigDecimal currentMileage;

    @Column(name = "current_hours", precision = 12, scale = 2)
    private BigDecimal currentHours;

    @Column(name = "insurance_expiry_date")
    private LocalDate insuranceExpiryDate;

    @Column(name = "tech_inspection_expiry_date")
    private LocalDate techInspectionExpiryDate;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
