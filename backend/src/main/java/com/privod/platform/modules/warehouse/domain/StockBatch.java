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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * ФСБУ 5/2019 — партия материала для учёта по методу средневзвешенной цены.
 * Каждый приходный документ создаёт партию; при расходе remainingQty уменьшается.
 * Средневзвешенная цена по партиям = SUM(remainingQty * unitCostPrice) / SUM(remainingQty).
 */
@Entity
@Table(name = "stock_batches", indexes = {
        @Index(name = "idx_stock_batches_org_mat_loc",
                columnList = "organization_id, material_id, location_id"),
        @Index(name = "idx_stock_batches_org_mat_remaining",
                columnList = "organization_id, material_id, remaining_qty")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StockBatch extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "location_id", nullable = false)
    private UUID locationId;

    @Column(name = "receipt_date", nullable = false)
    private LocalDate receiptDate;

    @Column(name = "unit_cost_price", nullable = false, precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal unitCostPrice = BigDecimal.ZERO;

    @Column(name = "original_qty", nullable = false, precision = 16, scale = 3)
    @Builder.Default
    private BigDecimal originalQty = BigDecimal.ZERO;

    @Column(name = "remaining_qty", nullable = false, precision = 16, scale = 3)
    @Builder.Default
    private BigDecimal remainingQty = BigDecimal.ZERO;

    /** Ссылка на исходное движение (StockMovement.id), если партия создана из документа. */
    @Column(name = "stock_movement_id")
    private UUID stockMovementId;
}
