package com.privod.platform.modules.ops.domain;

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

@Entity
@Table(name = "dispatch_routes", indexes = {
        @Index(name = "idx_dispatch_route_name", columnList = "name"),
        @Index(name = "idx_dispatch_route_active", columnList = "is_active")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchRoute extends BaseEntity {

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "from_location", nullable = false, length = 500)
    private String fromLocation;

    @Column(name = "to_location", nullable = false, length = 500)
    private String toLocation;

    @Column(name = "distance_km", precision = 10, scale = 2)
    private BigDecimal distanceKm;

    @Column(name = "estimated_duration_minutes")
    private int estimatedDurationMinutes;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
