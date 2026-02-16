package com.privod.platform.modules.planfact.domain;

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
@Table(name = "plan_fact_lines", indexes = {
        @Index(name = "idx_pf_project", columnList = "project_id"),
        @Index(name = "idx_pf_category", columnList = "category")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlanFactLine extends BaseEntity {

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "sequence")
    @Builder.Default
    private Integer sequence = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "category", nullable = false, length = 20)
    private PlanFactCategory category;

    @Column(name = "plan_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal planAmount;

    @Column(name = "fact_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal factAmount = BigDecimal.ZERO;

    @Column(name = "variance", precision = 18, scale = 2)
    private BigDecimal variance;

    @Column(name = "variance_percent", precision = 10, scale = 2)
    private BigDecimal variancePercent;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    public void computeVariance() {
        if (this.factAmount != null && this.planAmount != null) {
            this.variance = this.factAmount.subtract(this.planAmount);
            if (this.planAmount.compareTo(BigDecimal.ZERO) != 0) {
                this.variancePercent = this.variance
                        .multiply(new BigDecimal("100"))
                        .divide(this.planAmount, 2, RoundingMode.HALF_UP);
            } else {
                this.variancePercent = BigDecimal.ZERO;
            }
        }
    }
}
