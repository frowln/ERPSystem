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
@Table(name = "safety_risk_scores", indexes = {
        @Index(name = "idx_srs_org", columnList = "organization_id"),
        @Index(name = "idx_srs_project", columnList = "project_id"),
        @Index(name = "idx_srs_level", columnList = "risk_level"),
        @Index(name = "idx_srs_calculated", columnList = "calculated_at")
})
@Filter(name = "tenantFilter", condition = "organization_id = :organizationId")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SafetyRiskScore extends BaseEntity {

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @Column(name = "score", nullable = false)
    @Builder.Default
    private int score = 0;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false, length = 20)
    @Builder.Default
    private SafetyRiskLevel riskLevel = SafetyRiskLevel.LOW;

    @Column(name = "factors_json", columnDefinition = "TEXT")
    private String factorsJson;

    @Column(name = "recommendations_json", columnDefinition = "TEXT")
    private String recommendationsJson;

    @Column(name = "incident_count_30d")
    @Builder.Default
    private int incidentCount30d = 0;

    @Column(name = "violation_count_30d")
    @Builder.Default
    private int violationCount30d = 0;

    @Column(name = "training_compliance_pct", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal trainingCompliancePct = new BigDecimal("100.00");

    @Column(name = "cert_expiry_ratio", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal certExpiryRatio = BigDecimal.ZERO;

    @Column(name = "calculated_at", nullable = false)
    @Builder.Default
    private Instant calculatedAt = Instant.now();

    @Column(name = "valid_until")
    private Instant validUntil;

    public boolean isValid() {
        return validUntil == null || validUntil.isAfter(Instant.now());
    }
}
