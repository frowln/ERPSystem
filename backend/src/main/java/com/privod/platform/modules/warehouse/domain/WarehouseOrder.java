package com.privod.platform.modules.warehouse.domain;

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
import java.util.UUID;

/**
 * Складской ордер — приходный (М-4) или расходный (М-11).
 * Каждый ордер фиксирует факт приёма/выдачи материалов и привязан к StockMovement.
 */
@Entity
@Table(name = "warehouse_orders", indexes = {
        @Index(name = "idx_wo_org", columnList = "organization_id"),
        @Index(name = "idx_wo_org_status", columnList = "organization_id, status"),
        @Index(name = "idx_wo_org_number", columnList = "organization_id, order_number", unique = true),
        @Index(name = "idx_wo_type", columnList = "order_type"),
        @Index(name = "idx_wo_warehouse", columnList = "warehouse_id"),
        @Index(name = "idx_wo_stock_movement", columnList = "stock_movement_id"),
        @Index(name = "idx_wo_number", columnList = "order_number"),
        @Index(name = "idx_wo_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseOrder extends BaseEntity {

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "order_type", nullable = false, length = 20)
    private WarehouseOrderType orderType;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "warehouse_id", nullable = false)
    private UUID warehouseId;

    @Column(name = "stock_movement_id")
    private UUID stockMovementId;

    @Column(name = "counterparty_id")
    private UUID counterpartyId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "purchase_order_id")
    private UUID purchaseOrderId;

    @Column(name = "responsible_id")
    private UUID responsibleId;

    @Column(name = "receiver_id")
    private UUID receiverId;

    @Column(name = "total_quantity", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal totalQuantity = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private WarehouseOrderStatus status = WarehouseOrderStatus.DRAFT;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;
}
