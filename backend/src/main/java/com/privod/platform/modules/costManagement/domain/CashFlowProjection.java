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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cash_flow_projections", indexes = {
        @Index(name = "idx_cfp_project", columnList = "project_id"),
        @Index(name = "idx_cfp_period_start", columnList = "period_start"),
        @Index(name = "idx_cfp_period_end", columnList = "period_end")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashFlowProjection extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "planned_income", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal plannedIncome = BigDecimal.ZERO;

    @Column(name = "planned_expense", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal plannedExpense = BigDecimal.ZERO;

    @Column(name = "actual_income", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualIncome = BigDecimal.ZERO;

    @Column(name = "actual_expense", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualExpense = BigDecimal.ZERO;

    @Column(name = "forecast_income", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal forecastIncome = BigDecimal.ZERO;

    @Column(name = "forecast_expense", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal forecastExpense = BigDecimal.ZERO;

    @Column(name = "cumulative_planned_net", precision = 18, scale = 2)
    private BigDecimal cumulativePlannedNet;

    @Column(name = "cumulative_actual_net", precision = 18, scale = 2)
    private BigDecimal cumulativeActualNet;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public BigDecimal getPlannedNet() {
        BigDecimal income = this.plannedIncome != null ? this.plannedIncome : BigDecimal.ZERO;
        BigDecimal expense = this.plannedExpense != null ? this.plannedExpense : BigDecimal.ZERO;
        return income.subtract(expense);
    }

    public BigDecimal getActualNet() {
        BigDecimal income = this.actualIncome != null ? this.actualIncome : BigDecimal.ZERO;
        BigDecimal expense = this.actualExpense != null ? this.actualExpense : BigDecimal.ZERO;
        return income.subtract(expense);
    }

    public BigDecimal getForecastNet() {
        BigDecimal income = this.forecastIncome != null ? this.forecastIncome : BigDecimal.ZERO;
        BigDecimal expense = this.forecastExpense != null ? this.forecastExpense : BigDecimal.ZERO;
        return income.subtract(expense);
    }
}
