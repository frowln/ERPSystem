package com.privod.platform.modules.costManagement.domain;

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
@Table(name = "commitment_items", indexes = {
        @Index(name = "idx_commitment_item_commitment", columnList = "commitment_id"),
        @Index(name = "idx_commitment_item_cost_code", columnList = "cost_code_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommitmentItem extends BaseEntity {

    @Column(name = "commitment_id", nullable = false)
    private UUID commitmentId;

    @Column(name = "description", nullable = false, length = 500)
    private String description;

    @Column(name = "cost_code_id")
    private UUID costCodeId;

    @Column(name = "quantity", precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "unit_price", precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "total_price", precision = 18, scale = 2)
    private BigDecimal totalPrice;

    @Column(name = "invoiced_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal invoicedAmount = BigDecimal.ZERO;

    @Column(name = "sort_order")
    private Integer sortOrder;

    public void recalculateTotalPrice() {
        if (this.quantity != null && this.unitPrice != null) {
            this.totalPrice = this.quantity.multiply(this.unitPrice);
        }
    }
}
