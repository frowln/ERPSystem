package com.privod.platform.modules.warehouse.domain;

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
import java.util.UUID;

/**
 * Позиция складского ордера.
 */
@Entity
@Table(name = "warehouse_order_items", indexes = {
        @Index(name = "idx_woi_order", columnList = "warehouse_order_id"),
        @Index(name = "idx_woi_material", columnList = "material_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseOrderItem extends BaseEntity {

    @Column(name = "warehouse_order_id", nullable = false)
    private UUID warehouseOrderId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "material_name", length = 500)
    private String materialName;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit_price", precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_amount", precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "lot_number", length = 100)
    private String lotNumber;

    @Column(name = "certificate_number", length = 100)
    private String certificateNumber;
}
