package com.privod.platform.modules.procurementExt.domain;

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

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "deliveries", indexes = {
        @Index(name = "idx_del_route", columnList = "route_id"),
        @Index(name = "idx_del_status", columnList = "status"),
        @Index(name = "idx_del_purchase_order", columnList = "purchase_order_id"),
        @Index(name = "idx_del_driver", columnList = "driver_id"),
        @Index(name = "idx_del_tracking", columnList = "tracking_number"),
        @Index(name = "idx_del_planned_arrival", columnList = "planned_arrival_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Delivery extends BaseEntity {

    @Column(name = "route_id")
    private UUID routeId;

    @Column(name = "purchase_order_id")
    private UUID purchaseOrderId;

    @Column(name = "vehicle_id")
    private UUID vehicleId;

    @Column(name = "driver_id")
    private UUID driverId;

    @Column(name = "planned_departure_at")
    private Instant plannedDepartureAt;

    @Column(name = "planned_arrival_at")
    private Instant plannedArrivalAt;

    @Column(name = "actual_departure_at")
    private Instant actualDepartureAt;

    @Column(name = "actual_arrival_at")
    private Instant actualArrivalAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DeliveryStatus status = DeliveryStatus.PLANNED;

    @Column(name = "tracking_number", length = 100)
    private String trackingNumber;

    public boolean canTransitionTo(DeliveryStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
