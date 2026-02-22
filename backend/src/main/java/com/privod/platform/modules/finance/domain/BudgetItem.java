package com.privod.platform.modules.finance.domain;

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
import java.math.RoundingMode;
import java.util.UUID;

@Entity
@Table(name = "budget_items", indexes = {
        @Index(name = "idx_budget_item_budget", columnList = "budget_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetItem extends BaseEntity {

    @Column(name = "budget_id", nullable = false)
    private UUID budgetId;

    @Column(name = "sequence")
    @Builder.Default
    private Integer sequence = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private BudgetCategory category;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "planned_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal plannedAmount;

    @Column(name = "actual_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualAmount = BigDecimal.ZERO;

    @Column(name = "committed_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal committedAmount = BigDecimal.ZERO;

    @Column(name = "remaining_amount", precision = 18, scale = 2)
    private BigDecimal remainingAmount;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "margin_amount", precision = 18, scale = 2)
    private BigDecimal marginAmount;

    @Column(name = "margin_percent", precision = 8, scale = 4)
    private BigDecimal marginPercent;

    @Column(name = "section_id")
    private UUID sectionId;

    @Column(name = "customer_price", precision = 18, scale = 2)
    private BigDecimal customerPrice;

    @Column(name = "quantity", precision = 18, scale = 4)
    private BigDecimal quantity;

    @Column(name = "unit", length = 50)
    private String unit;

    @Column(name = "discipline_mark", length = 100)
    private String disciplineMark;

    @Column(name = "customer_total", precision = 18, scale = 2)
    private BigDecimal customerTotal;

    @Column(name = "is_section", nullable = false)
    @Builder.Default
    private boolean section = false;

    @Column(name = "contracted_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal contractedAmount = BigDecimal.ZERO;

    @Column(name = "parent_id")
    private UUID parentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", length = 30)
    private BudgetItemType itemType;

    @Column(name = "cost_price", precision = 18, scale = 2)
    private BigDecimal costPrice;

    @Column(name = "estimate_price", precision = 18, scale = 2)
    private BigDecimal estimatePrice;

    @Column(name = "coefficient", precision = 10, scale = 4)
    private BigDecimal coefficient;

    @Column(name = "sale_price", precision = 18, scale = 2)
    private BigDecimal salePrice;

    @Column(name = "vat_rate", precision = 5, scale = 2)
    private BigDecimal vatRate;

    @Column(name = "vat_amount", precision = 18, scale = 2)
    private BigDecimal vatAmount;

    @Column(name = "total_with_vat", precision = 18, scale = 2)
    private BigDecimal totalWithVat;

    @Column(name = "act_signed_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actSignedAmount = BigDecimal.ZERO;

    @Column(name = "invoiced_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal invoicedAmount = BigDecimal.ZERO;

    @Column(name = "paid_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "doc_status", length = 30)
    @Builder.Default
    private BudgetItemDocStatus docStatus = BudgetItemDocStatus.PLANNED;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_source_type", length = 30)
    private BudgetItemPriceSource priceSourceType;

    @Column(name = "price_source_id")
    private UUID priceSourceId;

    public BigDecimal calculateRemainingAmount() {
        BigDecimal planned = plannedAmount != null ? plannedAmount : BigDecimal.ZERO;
        BigDecimal actual = actualAmount != null ? actualAmount : BigDecimal.ZERO;
        BigDecimal committed = committedAmount != null ? committedAmount : BigDecimal.ZERO;
        return planned.subtract(actual).subtract(committed);
    }

    /**
     * Recalculate margin amount and percent from cost price and customer price.
     * Called when pricing fields change.
     */
    public void recalculateMargin() {
        BigDecimal cost = costPrice != null ? costPrice : BigDecimal.ZERO;
        BigDecimal cust = customerPrice != null ? customerPrice : BigDecimal.ZERO;
        BigDecimal qty = quantity != null ? quantity : BigDecimal.ONE;

        BigDecimal costTotal = cost.multiply(qty);
        BigDecimal custTotal = cust.multiply(qty);
        this.marginAmount = custTotal.subtract(costTotal).setScale(2, RoundingMode.HALF_UP);
        this.marginPercent = custTotal.compareTo(BigDecimal.ZERO) != 0
                ? this.marginAmount.multiply(new BigDecimal("100")).divide(custTotal, 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
    }

    /**
     * Recalculate sale price, VAT, and total from cost price, coefficient, and VAT rate.
     * Called when pricing source data changes (e.g., from commercial proposal confirmation).
     */
    public void recalculatePrices() {
        BigDecimal cost = costPrice != null ? costPrice : BigDecimal.ZERO;
        BigDecimal coeff = coefficient != null ? coefficient : BigDecimal.ONE;
        BigDecimal qty = quantity != null ? quantity : BigDecimal.ONE;
        BigDecimal vat = vatRate != null ? vatRate : BigDecimal.ZERO;

        this.salePrice = cost.multiply(coeff).setScale(2, java.math.RoundingMode.HALF_UP);
        BigDecimal total = this.salePrice.multiply(qty).setScale(2, java.math.RoundingMode.HALF_UP);
        this.vatAmount = total.multiply(vat).divide(new BigDecimal("100"), 2, java.math.RoundingMode.HALF_UP);
        this.totalWithVat = total.add(this.vatAmount);
        this.plannedAmount = total;
        this.remainingAmount = calculateRemainingAmount();
        recalculateMargin();
    }
}
