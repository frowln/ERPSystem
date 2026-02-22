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
@Table(name = "cash_flow_scenarios", indexes = {
        @Index(name = "idx_cf_scenario_org_project", columnList = "organization_id, project_id")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CashFlowScenario extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "name", nullable = false, length = 300)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "baseline_date")
    private LocalDate baselineDate;

    @Column(name = "horizon_months", nullable = false)
    @Builder.Default
    private int horizonMonths = 12;

    @Column(name = "growth_rate_percent", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal growthRatePercent = BigDecimal.ZERO;

    @Column(name = "payment_delay_days", nullable = false)
    @Builder.Default
    private int paymentDelayDays = 30;

    @Column(name = "retention_percent", nullable = false, precision = 6, scale = 2)
    @Builder.Default
    private BigDecimal retentionPercent = BigDecimal.ZERO;

    @Column(name = "include_vat", nullable = false)
    @Builder.Default
    private boolean includeVat = true;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean isActive = true;
}
