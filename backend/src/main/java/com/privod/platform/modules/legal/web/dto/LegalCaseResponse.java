package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.CaseStatus;
import com.privod.platform.modules.legal.domain.CaseType;
import com.privod.platform.modules.legal.domain.LegalCase;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LegalCaseResponse(
        UUID id,
        String caseNumber,
        UUID projectId,
        UUID contractId,
        String title,
        String description,
        CaseType caseType,
        String caseTypeDisplayName,
        CaseStatus status,
        String statusDisplayName,
        BigDecimal amount,
        String currency,
        UUID responsibleId,
        UUID lawyerId,
        String courtName,
        LocalDate filingDate,
        LocalDate hearingDate,
        LocalDate resolutionDate,
        String outcome,
        boolean closed,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static LegalCaseResponse fromEntity(LegalCase lc) {
        return new LegalCaseResponse(
                lc.getId(),
                lc.getCaseNumber(),
                lc.getProjectId(),
                lc.getContractId(),
                lc.getTitle(),
                lc.getDescription(),
                lc.getCaseType(),
                lc.getCaseType().getDisplayName(),
                lc.getStatus(),
                lc.getStatus().getDisplayName(),
                lc.getAmount(),
                lc.getCurrency(),
                lc.getResponsibleId(),
                lc.getLawyerId(),
                lc.getCourtName(),
                lc.getFilingDate(),
                lc.getHearingDate(),
                lc.getResolutionDate(),
                lc.getOutcome(),
                lc.isClosed(),
                lc.getCreatedAt(),
                lc.getUpdatedAt(),
                lc.getCreatedBy()
        );
    }
}
