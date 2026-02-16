package com.privod.platform.modules.ops.domain;

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
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "dispatch_orders", indexes = {
        @Index(name = "idx_dispatch_order_number", columnList = "order_number", unique = true),
        @Index(name = "idx_dispatch_project", columnList = "project_id"),
        @Index(name = "idx_dispatch_vehicle", columnList = "vehicle_id"),
        @Index(name = "idx_dispatch_driver", columnList = "driver_id"),
        @Index(name = "idx_dispatch_status", columnList = "status"),
        @Index(name = "idx_dispatch_scheduled_date", columnList = "scheduled_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchOrder extends BaseEntity {

    @Column(name = "order_number", nullable = false, unique = true, length = 50)
    private String orderNumber;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "driver_id")
    private UUID driverId;

    @Column(name = "loading_point", length = 500)
    private String loadingPoint;

    @Column(name = "unloading_point", length = 500)
    private String unloadingPoint;

    @Column(name = "material_name", length = 300)
    private String materialName;

    @Column(name = "quantity", precision = 12, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit", length = 30)
    private String unit;

    @Column(name = "scheduled_date")
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time", length = 10)
    private String scheduledTime;

    @Column(name = "actual_departure_at")
    private LocalDateTime actualDepartureAt;

    @Column(name = "actual_arrival_at")
    private LocalDateTime actualArrivalAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DispatchStatus status = DispatchStatus.PLANNED;

    @Column(name = "distance", precision = 10, scale = 2)
    private BigDecimal distance;

    @Column(name = "fuel_used", precision = 10, scale = 2)
    private BigDecimal fuelUsed;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public boolean canTransitionTo(DispatchStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
