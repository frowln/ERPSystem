package com.privod.platform.modules.safety.domain;

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
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "safety_risk_factors", indexes = {
        @Index(name = "idx_srf_org_project", columnList = "organization_id, project_id"),
        @Index(name = "idx_srf_type", columnList = "factor_type")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyRiskFactor extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "factor_type", nullable = false, length = 50)
    private RiskFactorType factorType;

    @Column(name = "weight", nullable = false, precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal weight = BigDecimal.ONE;

    @Column(name = "raw_value", precision = 15, scale = 4)
    private BigDecimal rawValue;

    @Column(name = "normalized_value", precision = 5, scale = 2)
    private BigDecimal normalizedValue;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "calculated_at", nullable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();
}
