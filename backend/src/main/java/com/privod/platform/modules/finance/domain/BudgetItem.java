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

    public BigDecimal calculateRemainingAmount() {
        BigDecimal planned = plannedAmount != null ? plannedAmount : BigDecimal.ZERO;
        BigDecimal actual = actualAmount != null ? actualAmount : BigDecimal.ZERO;
        BigDecimal committed = committedAmount != null ? committedAmount : BigDecimal.ZERO;
        return planned.subtract(actual).subtract(committed);
    }
}
