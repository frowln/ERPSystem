package com.privod.platform.modules.estimate.domain;

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
@Table(name = "estimates", indexes = {
        @Index(name = "idx_estimate_project", columnList = "project_id"),
        @Index(name = "idx_estimate_spec", columnList = "specification_id"),
        @Index(name = "idx_estimate_contract", columnList = "contract_id"),
        @Index(name = "idx_estimate_status", columnList = "status")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Estimate extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "contract_id")
    private UUID contractId;

    @Column(name = "specification_id", nullable = false)
    private UUID specificationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private EstimateStatus status = EstimateStatus.DRAFT;

    @Column(name = "total_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "ordered_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal orderedAmount = BigDecimal.ZERO;

    @Column(name = "invoiced_amount", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal invoicedAmount = BigDecimal.ZERO;

    @Column(name = "total_spent", precision = 18, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalSpent = BigDecimal.ZERO;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public BigDecimal getBalance() {
        return totalAmount.subtract(totalSpent);
    }

    public BigDecimal getVarianceAmount() {
        return totalAmount.subtract(orderedAmount);
    }

    public BigDecimal getVariancePercent() {
        if (totalAmount.compareTo(BigDecimal.ZERO) == 0) {
            return BigDecimal.ZERO;
        }
        return getVarianceAmount()
                .multiply(new BigDecimal("100"))
                .divide(totalAmount, 2, RoundingMode.HALF_UP);
    }

    public boolean canTransitionTo(EstimateStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
