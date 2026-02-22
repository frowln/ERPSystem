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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cash_flow_forecast_buckets", indexes = {
        @Index(name = "idx_cf_bucket_scenario", columnList = "scenario_id"),
        @Index(name = "idx_cf_bucket_org_period", columnList = "organization_id, period_start")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashFlowForecastBucket extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "scenario_id", nullable = false)
    private UUID scenarioId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "forecast_income", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal forecastIncome = BigDecimal.ZERO;

    @Column(name = "forecast_expense", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal forecastExpense = BigDecimal.ZERO;

    @Column(name = "forecast_net", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal forecastNet = BigDecimal.ZERO;

    @Column(name = "actual_income", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualIncome = BigDecimal.ZERO;

    @Column(name = "actual_expense", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualExpense = BigDecimal.ZERO;

    @Column(name = "actual_net", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualNet = BigDecimal.ZERO;

    @Column(name = "variance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal variance = BigDecimal.ZERO;

    @Column(name = "cumulative_forecast_net", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal cumulativeForecastNet = BigDecimal.ZERO;

    @Column(name = "cumulative_actual_net", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal cumulativeActualNet = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
