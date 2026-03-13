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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Заказ поставщику (Purchase Order).
 * Связывает заявку на закупку (PurchaseRequest) с контрагентом-поставщиком.
 * Промежуточное звено: PurchaseRequest → PurchaseOrder → Delivery → StockMovement.
 */
@Entity
@Table(name = "purchase_orders", indexes = {
        @Index(name = "idx_po_project", columnList = "project_id"),
        @Index(name = "idx_po_supplier", columnList = "supplier_id"),
        @Index(name = "idx_po_request", columnList = "purchase_request_id"),
        @Index(name = "idx_po_contract", columnList = "contract_id"),
        @Index(name = "idx_po_status", columnList = "status"),
        @Index(name = "idx_po_number", columnList = "order_number")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrder extends BaseEntity {

    @Column(name = "order_number", nullable = false, length = 50)
    private String orderNumber;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "purchase_request_id")
    private UUID purchaseRequestId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "supplier_id", nullable = false)
    private UUID supplierId;

    @Column(name = "order_date", nullable = false)
    private LocalDate orderDate;

    @Column(name = "expected_delivery_date")
    private LocalDate expectedDeliveryDate;

    @Column(name = "actual_delivery_date")
    private LocalDate actualDeliveryDate;

    @Column(name = "subtotal", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "vat_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal vatAmount = BigDecimal.ZERO;

    @Column(name = "total_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "currency", length = 3)
    @Builder.Default
    private String currency = "RUB";

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private PurchaseOrderStatus status = PurchaseOrderStatus.DRAFT;

    @Column(name = "payment_terms", length = 500)
    private String paymentTerms;

    @Column(name = "delivery_address", length = 1000)
    private String deliveryAddress;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    // P0-WAR-2: FK на статью бюджета для контроля лимита (ФСБУ 5/2019)
    @Column(name = "budget_item_id")
    private UUID budgetItemId;

    public boolean canTransitionTo(PurchaseOrderStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
