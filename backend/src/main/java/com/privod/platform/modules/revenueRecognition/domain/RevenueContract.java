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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "revenue_contracts", indexes = {
        @Index(name = "idx_rev_contract_project", columnList = "project_id"),
        @Index(name = "idx_rev_contract_contract", columnList = "contract_id"),
        @Index(name = "idx_rev_contract_org", columnList = "organization_id"),
        @Index(name = "idx_rev_contract_method", columnList = "recognition_method"),
        @Index(name = "idx_rev_contract_standard", columnList = "recognition_standard")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RevenueContract extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "contract_name", length = 500)
    private String contractName;

    @Enumerated(EnumType.STRING)
    @Column(name = "recognition_method", nullable = false, length = 30)
    @Builder.Default
    private RecognitionMethod recognitionMethod = RecognitionMethod.PERCENTAGE_OF_COMPLETION;

    @Enumerated(EnumType.STRING)
    @Column(name = "recognition_standard", nullable = false, length = 20)
    @Builder.Default
    private RecognitionStandard recognitionStandard = RecognitionStandard.PBU_2_2008;

    @Column(name = "total_contract_revenue", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalContractRevenue;

    @Column(name = "total_estimated_cost", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalEstimatedCost;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    /**
     * Проверяет, является ли контракт убыточным (totalEstimatedCost > totalContractRevenue).
     */
    public boolean isLossContract() {
        return totalEstimatedCost != null && totalContractRevenue != null
                && totalEstimatedCost.compareTo(totalContractRevenue) > 0;
    }

    /**
     * Возвращает ожидаемый убыток (если контракт убыточный).
     */
    public BigDecimal getExpectedLoss() {
        if (isLossContract()) {
            return totalEstimatedCost.subtract(totalContractRevenue);
        }
        return BigDecimal.ZERO;
    }

    /**
     * Возвращает ожидаемую прибыль (если контракт прибыльный).
     */
    public BigDecimal getExpectedProfit() {
        if (!isLossContract()) {
            return totalContractRevenue.subtract(totalEstimatedCost);
        }
        return BigDecimal.ZERO;
    }
}
