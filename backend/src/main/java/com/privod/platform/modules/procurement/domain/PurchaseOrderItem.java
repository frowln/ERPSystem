package com.privod.platform.modules.procurement.domain;

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

import com.privod.platform.infrastructure.finance.VatCalculator;

import java.math.BigDecimal;
import java.util.UUID;

@Entity(name = "ProcurementPurchaseOrderItem")
@Table(name = "purchase_order_items", indexes = {
        @Index(name = "idx_poi_order", columnList = "purchase_order_id"),
        @Index(name = "idx_poi_material", columnList = "material_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseOrderItem extends BaseEntity {

    @Column(name = "purchase_order_id", nullable = false)
    private UUID purchaseOrderId;

    @Column(name = "material_id", nullable = false)
    private UUID materialId;

    @Column(name = "material_name", length = 500)
    private String materialName;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "quantity", nullable = false, precision = 18, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal vatRate = VatCalculator.DEFAULT_RATE;

    @Column(name = "total_amount", precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "delivered_quantity", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal deliveredQuantity = BigDecimal.ZERO;

    @Column(name = "specification_item_id")
    private UUID specificationItemId;

    public void computeTotalAmount() {
        if (this.quantity != null && this.unitPrice != null) {
            this.totalAmount = this.quantity.multiply(this.unitPrice);
        }
    }
}
