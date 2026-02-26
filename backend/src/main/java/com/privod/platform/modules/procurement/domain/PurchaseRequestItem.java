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

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "purchase_request_items", indexes = {
        @Index(name = "idx_pri_request", columnList = "request_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PurchaseRequestItem extends BaseEntity {

    @Column(name = "request_id", nullable = false)
    private UUID requestId;

    @Column(name = "spec_item_id")
    private UUID specItemId;

    @Column(name = "sequence")
    @Builder.Default
    private Integer sequence = 0;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_of_measure", nullable = false, length = 50)
    private String unitOfMeasure;

    @Column(name = "unit_price", precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "status", length = 50)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "covered_quantity", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal coveredQuantity = BigDecimal.ZERO;

    @Column(name = "best_price", precision = 18, scale = 2)
    private BigDecimal bestPrice;

    @Column(name = "best_vendor_name", length = 500)
    private String bestVendorName;

    public void computeAmount() {
        if (this.quantity != null && this.unitPrice != null) {
            this.amount = this.quantity.multiply(this.unitPrice);
        }
    }
}
