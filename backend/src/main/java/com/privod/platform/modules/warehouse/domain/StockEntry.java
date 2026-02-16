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
import java.util.UUID;

@Entity
@Table(name = "stock_entries", indexes = {
        @Index(name = "idx_stock_org", columnList = "organization_id"),
        @Index(name = "idx_stock_org_location", columnList = "organization_id, location_id"),
        @Index(name = "idx_stock_material", columnList = "material_id"),
        @Index(name = "idx_stock_location", columnList = "location_id")
}, uniqueConstraints = {
        @UniqueConstraint(name = "uq_stock_material_location",
                columnNames = {"organization_id", "material_id", "location_id", "deleted"})
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockEntry extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "material_name", length = 500)
    private String materialName;

    @Column(name = "location_id", nullable = false)
    private UUID locationId;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "reserved_quantity", precision = 16, scale = 3)
    @Builder.Default
    private BigDecimal reservedQuantity = BigDecimal.ZERO;

    @Column(name = "available_quantity", precision = 16, scale = 3)
    @Builder.Default
    private BigDecimal availableQuantity = BigDecimal.ZERO;

    @Column(name = "last_price_per_unit", precision = 18, scale = 2)
    private BigDecimal lastPricePerUnit;

    @Column(name = "total_value", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalValue = BigDecimal.ZERO;

    public void recalculate() {
        this.availableQuantity = this.quantity.subtract(
                this.reservedQuantity != null ? this.reservedQuantity : BigDecimal.ZERO);
        if (this.lastPricePerUnit != null && this.quantity != null) {
            this.totalValue = this.quantity.multiply(this.lastPricePerUnit);
        }
    }
}
