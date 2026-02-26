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
import java.time.LocalDate;
import java.util.UUID;

/**
 * Distributes a BudgetItem's amount across time periods based on the linked WbsNode schedule.
 * Used for building CashFlow models and Time-phased budgets.
 */
@Entity
@Table(name = "budget_item_distributions", indexes = {
        @Index(name = "idx_bid_budget_item", columnList = "budget_item_id"),
        @Index(name = "idx_bid_period", columnList = "period_start, period_end")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetItemDistribution extends BaseEntity {

    @Column(name = "budget_item_id", nullable = false)
    private UUID budgetItemId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    /**
     * E.g., MONTH, WEEK, DAY
     */
    @Column(name = "period_type", length = 20)
    @Builder.Default
    private String periodType = "MONTH";

    @Column(name = "planned_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal plannedAmount = BigDecimal.ZERO;

    @Column(name = "planned_quantity", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal plannedQuantity = BigDecimal.ZERO;

    @Column(name = "actual_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualAmount = BigDecimal.ZERO;

    @Column(name = "actual_quantity", precision = 18, scale = 4)
    @Builder.Default
    private BigDecimal actualQuantity = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
