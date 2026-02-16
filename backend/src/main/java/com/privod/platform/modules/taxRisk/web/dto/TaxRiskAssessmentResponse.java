package com.privod.platform.modules.taxRisk.web.dto;

import com.privod.platform.modules.taxRisk.domain.AssessmentStatus;
import com.privod.platform.modules.taxRisk.domain.RiskLevel;
import com.privod.platform.modules.taxRisk.domain.TaxRiskAssessment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TaxRiskAssessmentResponse(
        UUID id,
        String name,
        String code,
        UUID projectId,
        UUID organizationId,
        LocalDate assessmentDate,
        String assessor,
        RiskLevel riskLevel,
        String riskLevelDisplayName,
        AssessmentStatus status,
        String statusDisplayName,
        BigDecimal overallScore,
        String description,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static TaxRiskAssessmentResponse fromEntity(TaxRiskAssessment a) {
        return new TaxRiskAssessmentResponse(
                a.getId(),
                a.getName(),
                a.getCode(),
                a.getProjectId(),
                a.getOrganizationId(),
                a.getAssessmentDate(),
                a.getAssessor(),
                a.getRiskLevel(),
                a.getRiskLevel() != null ? a.getRiskLevel().getDisplayName() : null,
                a.getStatus(),
                a.getStatus().getDisplayName(),
                a.getOverallScore(),
                a.getDescription(),
                a.getCreatedAt(),
                a.getUpdatedAt(),
                a.getCreatedBy()
        );
    }
}
