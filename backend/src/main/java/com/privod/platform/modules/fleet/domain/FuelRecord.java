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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "fuel_records", indexes = {
        @Index(name = "idx_fuel_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_fuel_operator", columnList = "operator_id"),
        @Index(name = "idx_fuel_project", columnList = "project_id"),
        @Index(name = "idx_fuel_date", columnList = "fuel_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FuelRecord extends BaseEntity {

    @Column(name = "vehicle_id", nullable = false)
    private UUID vehicleId;

    @Column(name = "operator_id")
    private UUID operatorId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "fuel_date", nullable = false)
    private LocalDate fuelDate;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantity;

    @Column(name = "price_per_unit", nullable = false, precision = 10, scale = 2)
    private BigDecimal pricePerUnit;

    @Column(name = "total_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalCost;

    @Column(name = "mileage_at_fuel", precision = 12, scale = 2)
    private BigDecimal mileageAtFuel;

    @Column(name = "hours_at_fuel", precision = 12, scale = 2)
    private BigDecimal hoursAtFuel;

    @Column(name = "fuel_station", length = 300)
    private String fuelStation;

    @Column(name = "receipt_number", length = 100)
    private String receiptNumber;
}
