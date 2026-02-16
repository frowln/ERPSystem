package com.privod.platform.modules.warehouse.domain;

import com.privod.platform.infrastructure.persistence.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "stock_limits", indexes = {
        @Index(name = "idx_sl_org", columnList = "organization_id"),
        @Index(name = "idx_sl_org_material", columnList = "organization_id, material_id"),
        @Index(name = "idx_sl_org_location", columnList = "organization_id, warehouse_location_id"),
        @Index(name = "idx_sl_material", columnList = "material_id"),
        @Index(name = "idx_sl_warehouse_location", columnList = "warehouse_location_id"),
        @Index(name = "idx_sl_active", columnList = "is_active")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_stock_limit_material_location",
                columnNames = {"organization_id", "material_id", "warehouse_location_id", "deleted"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockLimit extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "warehouse_location_id", nullable = false)
    private UUID warehouseLocationId;

    @Column(name = "min_quantity", precision = 16, scale = 3)
    private BigDecimal minQuantity;

    @Column(name = "max_quantity", precision = 16, scale = 3)
    private BigDecimal maxQuantity;

    @Column(name = "reorder_point", precision = 16, scale = 3)
    private BigDecimal reorderPoint;

    @Column(name = "reorder_quantity", precision = 16, scale = 3)
    private BigDecimal reorderQuantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;

    @Column(name = "last_alert_at")
    private LocalDateTime lastAlertAt;
}
