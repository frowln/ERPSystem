package com.privod.platform.modules.taxRisk.domain;

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
import java.util.UUID;

@Entity
@Table(name = "tax_risk_factors", indexes = {
        @Index(name = "idx_tax_risk_factor_assessment", columnList = "assessment_id"),
        @Index(name = "idx_tax_risk_factor_category", columnList = "factor_category")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxRiskFactor extends BaseEntity {

    @Column(name = "assessment_id", nullable = false)
    private UUID assessmentId;

    @Column(name = "factor_name", nullable = false, length = 500)
    private String factorName;

    @Enumerated(EnumType.STRING)
    @Column(name = "factor_category", nullable = false, length = 20)
    private FactorCategory factorCategory;

    @Column(name = "weight", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal weight = BigDecimal.ONE;

    @Column(name = "score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal score = BigDecimal.ZERO;

    @Column(name = "weighted_score", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal weightedScore = BigDecimal.ZERO;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "recommendation", columnDefinition = "TEXT")
    private String recommendation;

    @Column(name = "evidence", columnDefinition = "TEXT")
    private String evidence;
}
