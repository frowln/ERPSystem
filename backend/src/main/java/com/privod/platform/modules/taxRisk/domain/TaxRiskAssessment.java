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
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "tax_risk_assessments", indexes = {
        @Index(name = "idx_tax_risk_assess_project", columnList = "project_id"),
        @Index(name = "idx_tax_risk_assess_org", columnList = "organization_id"),
        @Index(name = "idx_tax_risk_assess_code", columnList = "code", unique = true),
        @Index(name = "idx_tax_risk_assess_status", columnList = "status"),
        @Index(name = "idx_tax_risk_assess_risk_level", columnList = "risk_level"),
        @Index(name = "idx_tax_risk_assess_date", columnList = "assessment_date")
})
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TaxRiskAssessment extends BaseEntity {

    @Column(name = "name", nullable = false, length = 500)
    private String name;

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Column(name = "project_id")
    private UUID projectId;

    @Column(name = "organization_id")
    private UUID organizationId;

    @Column(name = "assessment_date")
    private LocalDate assessmentDate;

    @Column(name = "assessor", length = 255)
    private String assessor;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", length = 20)
    private RiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private AssessmentStatus status = AssessmentStatus.DRAFT;

    @Column(name = "overall_score", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal overallScore = BigDecimal.ZERO;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    public boolean canTransitionTo(AssessmentStatus newStatus) {
        return this.status.canTransitionTo(newStatus);
    }
}
