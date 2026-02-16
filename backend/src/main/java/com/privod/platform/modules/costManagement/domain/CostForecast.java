package com.privod.platform.modules.costManagement.domain;

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
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cost_forecasts", indexes = {
        @Index(name = "idx_cost_forecast_project", columnList = "project_id"),
        @Index(name = "idx_cost_forecast_date", columnList = "forecast_date"),
        @Index(name = "idx_cost_forecast_method", columnList = "forecast_method")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostForecast extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "forecast_date", nullable = false)
    private LocalDate forecastDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "forecast_method", length = 20)
    private ForecastMethod forecastMethod;

    /** BAC — Budget at Completion */
    @Column(name = "budget_at_completion", precision = 18, scale = 2)
    private BigDecimal budgetAtCompletion;

    /** EV — Earned Value (BCWP) */
    @Column(name = "earned_value", precision = 18, scale = 2)
    private BigDecimal earnedValue;

    /** PV — Planned Value (BCWS) */
    @Column(name = "planned_value", precision = 18, scale = 2)
    private BigDecimal plannedValue;

    /** AC — Actual Cost (ACWP) */
    @Column(name = "actual_cost", precision = 18, scale = 2)
    private BigDecimal actualCost;

    /** EAC — Estimate at Completion */
    @Column(name = "estimate_at_completion", precision = 18, scale = 2)
    private BigDecimal estimateAtCompletion;

    /** ETC — Estimate to Complete */
    @Column(name = "estimate_to_complete", precision = 18, scale = 2)
    private BigDecimal estimateToComplete;

    /** VAC — Variance at Completion */
    @Column(name = "variance_at_completion", precision = 18, scale = 2)
    private BigDecimal varianceAtCompletion;

    /** CPI = EV / AC */
    @Column(name = "cost_performance_index", precision = 10, scale = 4)
    private BigDecimal costPerformanceIndex;

    /** SPI = EV / PV */
    @Column(name = "schedule_performance_index", precision = 10, scale = 4)
    private BigDecimal schedulePerformanceIndex;

    /** CV = EV - AC */
    @Column(name = "cost_variance", precision = 18, scale = 2)
    private BigDecimal costVariance;

    /** SV = EV - PV */
    @Column(name = "schedule_variance", precision = 18, scale = 2)
    private BigDecimal scheduleVariance;

    @Column(name = "percent_complete", precision = 5, scale = 2)
    private BigDecimal percentComplete;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_by_id")
    private UUID createdById;

    /**
     * Recalculate all EVM indicators from base values (BAC, EV, PV, AC).
     */
    public void calculateEvmIndicators() {
        BigDecimal ev = this.earnedValue != null ? this.earnedValue : BigDecimal.ZERO;
        BigDecimal pv = this.plannedValue != null ? this.plannedValue : BigDecimal.ZERO;
        BigDecimal ac = this.actualCost != null ? this.actualCost : BigDecimal.ZERO;
        BigDecimal bac = this.budgetAtCompletion != null ? this.budgetAtCompletion : BigDecimal.ZERO;

        // CV = EV - AC
        this.costVariance = ev.subtract(ac);

        // SV = EV - PV
        this.scheduleVariance = ev.subtract(pv);

        // CPI = EV / AC
        if (ac.compareTo(BigDecimal.ZERO) != 0) {
            this.costPerformanceIndex = ev.divide(ac, 4, RoundingMode.HALF_UP);
        } else {
            this.costPerformanceIndex = BigDecimal.ZERO;
        }

        // SPI = EV / PV
        if (pv.compareTo(BigDecimal.ZERO) != 0) {
            this.schedulePerformanceIndex = ev.divide(pv, 4, RoundingMode.HALF_UP);
        } else {
            this.schedulePerformanceIndex = BigDecimal.ZERO;
        }

        // EAC = BAC / CPI
        if (this.costPerformanceIndex.compareTo(BigDecimal.ZERO) != 0) {
            this.estimateAtCompletion = bac.divide(this.costPerformanceIndex, 2, RoundingMode.HALF_UP);
        } else {
            this.estimateAtCompletion = BigDecimal.ZERO;
        }

        // ETC = EAC - AC
        this.estimateToComplete = this.estimateAtCompletion.subtract(ac);

        // VAC = BAC - EAC
        this.varianceAtCompletion = bac.subtract(this.estimateAtCompletion);
    }
}
