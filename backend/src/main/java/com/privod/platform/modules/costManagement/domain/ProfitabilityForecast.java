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
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "profitability_forecasts", indexes = {
        @Index(name = "idx_profitability_forecast_org_project", columnList = "organization_id, project_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitabilityForecast extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "project_name", length = 500)
    private String projectName;

    @Column(name = "contract_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal contractAmount = BigDecimal.ZERO;

    @Column(name = "original_budget", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal originalBudget = BigDecimal.ZERO;

    @Column(name = "revised_budget", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal revisedBudget = BigDecimal.ZERO;

    @Column(name = "actual_cost_to_date", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualCostToDate = BigDecimal.ZERO;

    @Column(name = "earned_value_to_date", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal earnedValueToDate = BigDecimal.ZERO;

    @Column(name = "estimate_at_completion", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal estimateAtCompletion = BigDecimal.ZERO;

    @Column(name = "estimate_to_complete", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal estimateToComplete = BigDecimal.ZERO;

    @Column(name = "forecast_margin", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal forecastMargin = BigDecimal.ZERO;

    @Column(name = "forecast_margin_percent", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal forecastMarginPercent = BigDecimal.ZERO;

    @Column(name = "original_margin", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal originalMargin = BigDecimal.ZERO;

    @Column(name = "profit_fade_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal profitFadeAmount = BigDecimal.ZERO;

    @Column(name = "profit_fade_percent", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal profitFadePercent = BigDecimal.ZERO;

    @Column(name = "wip_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal wipAmount = BigDecimal.ZERO;

    @Column(name = "over_billing_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal overBillingAmount = BigDecimal.ZERO;

    @Column(name = "under_billing_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal underBillingAmount = BigDecimal.ZERO;

    @Column(name = "completion_percent", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal completionPercent = BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    @Builder.Default
    private ProfitabilityRiskLevel riskLevel = ProfitabilityRiskLevel.LOW;

    @Column(name = "last_calculated_at")
    private LocalDateTime lastCalculatedAt;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;
}
