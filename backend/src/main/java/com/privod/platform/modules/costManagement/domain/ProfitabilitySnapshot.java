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
@Table(name = "profitability_snapshots", indexes = {
        @Index(name = "idx_profitability_snapshot_org_project", columnList = "organization_id, project_id"),
        @Index(name = "idx_profitability_snapshot_project_date", columnList = "project_id, snapshot_date")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfitabilitySnapshot extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "forecast_id")
    private UUID forecastId;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "eac", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal eac = BigDecimal.ZERO;

    @Column(name = "etc", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal etc = BigDecimal.ZERO;

    @Column(name = "actual_cost", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal actualCost = BigDecimal.ZERO;

    @Column(name = "earned_value", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal earnedValue = BigDecimal.ZERO;

    @Column(name = "forecast_margin", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal forecastMargin = BigDecimal.ZERO;

    @Column(name = "forecast_margin_percent", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal forecastMarginPercent = BigDecimal.ZERO;

    @Column(name = "wip_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal wipAmount = BigDecimal.ZERO;

    @Column(name = "profit_fade_amount", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal profitFadeAmount = BigDecimal.ZERO;

    @Column(name = "completion_percent", precision = 8, scale = 4)
    @Builder.Default
    private BigDecimal completionPercent = BigDecimal.ZERO;
}
