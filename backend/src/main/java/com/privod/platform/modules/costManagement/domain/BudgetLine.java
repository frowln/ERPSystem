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
@Table(name = "budget_lines", indexes = {
        @Index(name = "idx_budget_line_project", columnList = "project_id"),
        @Index(name = "idx_budget_line_cost_code", columnList = "cost_code_id")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetLine extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "cost_code_id", nullable = false)
    private UUID costCodeId;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "original_budget", nullable = false, precision = 18, scale = 2)
    private BigDecimal originalBudget;

    @Column(name = "approved_changes", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal approvedChanges = BigDecimal.ZERO;

    /** Computed: originalBudget + approvedChanges */
    @Column(name = "revised_budget", precision = 18, scale = 2)
    private BigDecimal revisedBudget;

    @Column(name = "committed_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal committedCost = BigDecimal.ZERO;

    @Column(name = "actual_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualCost = BigDecimal.ZERO;

    @Column(name = "forecast_final_cost", precision = 18, scale = 2)
    private BigDecimal forecastFinalCost;

    /** Computed: revisedBudget - forecastFinalCost */
    @Column(name = "variance_amount", precision = 18, scale = 2)
    private BigDecimal varianceAmount;

    /**
     * Recalculate computed fields.
     */
    public void recalculate() {
        BigDecimal original = this.originalBudget != null ? this.originalBudget : BigDecimal.ZERO;
        BigDecimal changes = this.approvedChanges != null ? this.approvedChanges : BigDecimal.ZERO;
        this.revisedBudget = original.add(changes);

        BigDecimal forecast = this.forecastFinalCost != null ? this.forecastFinalCost : BigDecimal.ZERO;
        this.varianceAmount = this.revisedBudget.subtract(forecast);
    }

    public BigDecimal getUncommittedBudget() {
        BigDecimal revised = this.revisedBudget != null ? this.revisedBudget : BigDecimal.ZERO;
        BigDecimal committed = this.committedCost != null ? this.committedCost : BigDecimal.ZERO;
        return revised.subtract(committed);
    }
}
