package com.privod.platform.modules.taxRisk.web.dto;

import com.privod.platform.modules.taxRisk.domain.MitigationStatus;
import com.privod.platform.modules.taxRisk.domain.TaxRiskMitigation;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TaxRiskMitigationResponse(
        UUID id,
        UUID assessmentId,
        UUID factorId,
        String action,
        String responsible,
        LocalDate deadline,
        MitigationStatus status,
        String statusDisplayName,
        String result,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static TaxRiskMitigationResponse fromEntity(TaxRiskMitigation m) {
        return new TaxRiskMitigationResponse(
                m.getId(),
                m.getAssessmentId(),
                m.getFactorId(),
                m.getAction(),
                m.getResponsible(),
                m.getDeadline(),
                m.getStatus(),
                m.getStatus().getDisplayName(),
                m.getResult(),
                m.getCreatedAt(),
                m.getUpdatedAt(),
                m.getCreatedBy()
        );
    }
}
