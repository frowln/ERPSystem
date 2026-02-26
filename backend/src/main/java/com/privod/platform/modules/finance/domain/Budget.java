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
@Table(name = "budgets", indexes = {
        @Index(name = "idx_budget_project", columnList = "project_id"),
        @Index(name = "idx_budget_contract", columnList = "contract_id"),
        @Index(name = "idx_budget_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Budget extends BaseEntity {

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BudgetStatus status = BudgetStatus.DRAFT;

    @Column(name = "planned_revenue", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal plannedRevenue = BigDecimal.ZERO;

    @Column(name = "planned_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal plannedCost = BigDecimal.ZERO;

    @Column(name = "planned_margin", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal plannedMargin = BigDecimal.ZERO;

    @Column(name = "actual_revenue", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualRevenue = BigDecimal.ZERO;

    @Column(name = "actual_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualCost = BigDecimal.ZERO;

    @Column(name = "actual_margin", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualMargin = BigDecimal.ZERO;

    @Column(name = "doc_version")
    @Builder.Default
    private Integer docVersion = 1;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "contingency_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal contingencyPercent = new BigDecimal("5.00");

    @Column(name = "overhead_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overheadPercent = new BigDecimal("12.00");

    @Column(name = "temp_structures_percent", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal tempStructuresPercent = new BigDecimal("3.00");

    public boolean canTransitionTo(BudgetStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }

    public BigDecimal getRevenueVariance() {
        BigDecimal planned = plannedRevenue != null ? plannedRevenue : BigDecimal.ZERO;
        BigDecimal actual = actualRevenue != null ? actualRevenue : BigDecimal.ZERO;
        return actual.subtract(planned);
    }

    public BigDecimal getCostVariance() {
        BigDecimal planned = plannedCost != null ? plannedCost : BigDecimal.ZERO;
        BigDecimal actual = actualCost != null ? actualCost : BigDecimal.ZERO;
        return actual.subtract(planned);
    }

    public BigDecimal getMarginVariance() {
        BigDecimal planned = plannedMargin != null ? plannedMargin : BigDecimal.ZERO;
        BigDecimal actual = actualMargin != null ? actualMargin : BigDecimal.ZERO;
        return actual.subtract(planned);
    }

    public BigDecimal getRevenueVariancePercent() {
        BigDecimal planned = plannedRevenue != null ? plannedRevenue : BigDecimal.ZERO;
        if (planned.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return getRevenueVariance()
                .multiply(new BigDecimal("100"))
                .divide(planned, 2, RoundingMode.HALF_UP);
    }

    public BigDecimal getCostVariancePercent() {
        BigDecimal planned = plannedCost != null ? plannedCost : BigDecimal.ZERO;
        if (planned.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return getCostVariance()
                .multiply(new BigDecimal("100"))
                .divide(planned, 2, RoundingMode.HALF_UP);
    }
}
