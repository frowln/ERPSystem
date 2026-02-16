package com.privod.platform.modules.procurementExt.domain;

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

@Entity
@Table(name = "dispatch_items", indexes = {
        @Index(name = "idx_dsi_order", columnList = "order_id"),
        @Index(name = "idx_dsi_material", columnList = "material_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchItem extends BaseEntity {

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "from_warehouse_id")
    private UUID fromWarehouseId;

    @Column(name = "to_warehouse_id")
    private UUID toWarehouseId;
}
