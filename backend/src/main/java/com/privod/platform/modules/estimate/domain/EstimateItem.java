package com.privod.platform.modules.estimate.domain;

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
import java.math.RoundingMode;
import java.util.UUID;

@Entity
@Table(name = "estimate_items", indexes = {
        @Index(name = "idx_est_item_estimate", columnList = "estimate_id"),
        @Index(name = "idx_est_item_project", columnList = "project_id"),
        @Index(name = "idx_est_item_spec_item", columnList = "spec_item_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EstimateItem extends BaseEntity {

    @Column(name = "estimate_id", nullable = false)
    private UUID estimateId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "spec_item_id")
    private UUID specItemId;

    @Column(name = "sequence", nullable = false)
    @Builder.Default
    private Integer sequence = 0;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "quantity", nullable = false, precision = 16, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_of_measure", nullable = false, length = 50)
    private String unitOfMeasure;

    @Column(name = "unit_price", nullable = false, precision = 18, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "unit_price_customer", precision = 18, scale = 2)
    private BigDecimal unitPriceCustomer;

    @Column(name = "amount", precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "amount_customer", precision = 18, scale = 2)
    private BigDecimal amountCustomer;

    @Column(name = "ordered_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal orderedAmount = BigDecimal.ZERO;

    @Column(name = "invoiced_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal invoicedAmount = BigDecimal.ZERO;

    @Column(name = "delivered_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal deliveredAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public void calculateAmount() {
        this.amount = this.quantity.multiply(this.unitPrice).setScale(2, RoundingMode.HALF_UP);
        if (this.unitPriceCustomer != null) {
            this.amountCustomer = this.quantity.multiply(this.unitPriceCustomer).setScale(2, RoundingMode.HALF_UP);
        }
    }

    public BigDecimal getBalance() {
        if (amount == null) return BigDecimal.ZERO;
        return amount.subtract(orderedAmount);
    }

    public BigDecimal getBalancePercent() {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return getBalance()
                .multiply(new BigDecimal("100"))
                .divide(amount, 2, RoundingMode.HALF_UP);
    }
}
