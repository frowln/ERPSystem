package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.legal.domain.CaseStatus;
import com.privod.platform.modules.legal.domain.CaseType;
import com.privod.platform.modules.legal.domain.LegalCase;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LegalCaseResponse(
        UUID id,
        UUID projectId,
        UUID contractId,
        String caseNumber,
        String courtName,
        String title,
        String description,
        CaseType caseType,
        BigDecimal amount,
        String currency,
        CaseStatus status,
        String statusDisplayName,
        LocalDate filingDate,
        LocalDate hearingDate,
        LocalDate resolutionDate,
        UUID responsibleId,
        UUID lawyerId,
        String outcome,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static LegalCaseResponse fromEntity(LegalCase entity) {
        return new LegalCaseResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getContractId(),
                entity.getCaseNumber(),
                entity.getCourtName(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getCaseType(),
                entity.getAmount(),
                entity.getCurrency(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getFilingDate(),
                entity.getHearingDate(),
                entity.getResolutionDate(),
                entity.getResponsibleId(),
                entity.getLawyerId(),
                entity.getOutcome(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
