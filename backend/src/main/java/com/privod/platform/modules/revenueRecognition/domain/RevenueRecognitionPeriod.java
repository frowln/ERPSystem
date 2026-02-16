package com.privod.platform.modules.revenueRecognition.domain;

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
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "revenue_recognition_periods", indexes = {
        @Index(name = "idx_rev_period_contract", columnList = "revenue_contract_id"),
        @Index(name = "idx_rev_period_status", columnList = "status"),
        @Index(name = "idx_rev_period_dates", columnList = "period_start, period_end")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueRecognitionPeriod extends BaseEntity {

    @Column(name = "revenue_contract_id", nullable = false)
    private UUID revenueContractId;

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PeriodStatus status = PeriodStatus.OPEN;

    @Column(name = "cumulative_cost_incurred", precision = 18, scale = 2)
    private BigDecimal cumulativeCostIncurred;

    @Column(name = "cumulative_revenue_recognized", precision = 18, scale = 2)
    private BigDecimal cumulativeRevenueRecognized;

    @Column(name = "period_cost_incurred", precision = 18, scale = 2)
    private BigDecimal periodCostIncurred;

    @Column(name = "period_revenue_recognized", precision = 18, scale = 2)
    private BigDecimal periodRevenueRecognized;

    @Column(name = "percent_complete", precision = 7, scale = 4)
    private BigDecimal percentComplete;

    @Column(name = "estimate_cost_to_complete", precision = 18, scale = 2)
    private BigDecimal estimateCostToComplete;

    @Column(name = "expected_profit", precision = 18, scale = 2)
    private BigDecimal expectedProfit;

    @Column(name = "expected_loss", precision = 18, scale = 2)
    private BigDecimal expectedLoss;

    @Column(name = "adjustment_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal adjustmentAmount = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "calculated_by_id")
    private UUID calculatedById;

    @Column(name = "reviewed_by_id")
    private UUID reviewedById;

    @Column(name = "posted_by_id")
    private UUID postedById;

    @Column(name = "posted_at")
    private Instant postedAt;

    public boolean canTransitionTo(PeriodStatus target) {
        return this.status.canTransitionTo(target);
    }
}
