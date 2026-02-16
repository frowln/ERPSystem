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
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "material_reservations", indexes = {
        @Index(name = "idx_mr_material", columnList = "material_id"),
        @Index(name = "idx_mr_project", columnList = "project_id"),
        @Index(name = "idx_mr_status", columnList = "status"),
        @Index(name = "idx_mr_work_order", columnList = "work_order_id"),
        @Index(name = "idx_mr_expires_at", columnList = "expires_at")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialReservation extends BaseEntity {

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "reserved_by_id")
    private UUID reservedById;

    @Column(name = "reserved_at", nullable = false)
    @Builder.Default
    private Instant reservedAt = Instant.now();

    @Column(name = "expires_at")
    private Instant expiresAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReservationStatus status = ReservationStatus.ACTIVE;

    @Column(name = "work_order_id")
    private UUID workOrderId;
}
