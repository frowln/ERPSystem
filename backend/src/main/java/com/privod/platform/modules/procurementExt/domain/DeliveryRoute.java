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

import java.math.BigDecimal;

@Entity
@Table(name = "delivery_routes", indexes = {
        @Index(name = "idx_drt_code", columnList = "code")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryRoute extends BaseEntity {

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "from_address", length = 1000)
    private String fromAddress;

    @Column(name = "to_address", length = 1000)
    private String toAddress;

    @Column(name = "distance_km", precision = 10, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "estimated_hours", precision = 6, scale = 2)
    private BigDecimal estimatedHours;

    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type", length = 30)
    private VehicleType vehicleType;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;
}
