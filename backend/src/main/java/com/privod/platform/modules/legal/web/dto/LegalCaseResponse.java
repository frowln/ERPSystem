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
        String number,
        String caseNumber,
        UUID projectId,
        String projectName,
        UUID contractId,
        String contractName,
        String title,
        String description,
        CaseType caseType,
        String caseTypeDisplayName,
        CaseStatus status,
        String statusDisplayName,
        BigDecimal amount,
        BigDecimal claimAmount,
        BigDecimal resolvedAmount,
        String currency,
        UUID responsibleId,
        String responsibleName,
        UUID lawyerId,
        String assignedLawyerName,
        String opposingParty,
        String courtName,
        LocalDate filingDate,
        LocalDate hearingDate,
        LocalDate resolutionDate,
        String outcome,
        boolean closed,
        int decisionCount,
        int remarkCount,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static LegalCaseResponse fromEntity(LegalCase lc) {
        String number = lc.getCaseNumber() != null ? lc.getCaseNumber() : lc.getId().toString().substring(0, 8);
        return new LegalCaseResponse(
                lc.getId(),
                number,
                lc.getCaseNumber(),
                lc.getProjectId(),
                null,
                lc.getContractId(),
                null,
                lc.getTitle(),
                lc.getDescription(),
                lc.getCaseType(),
                lc.getCaseType() != null ? lc.getCaseType().getDisplayName() : "",
                lc.getStatus(),
                lc.getStatus() != null ? lc.getStatus().getDisplayName() : "",
                lc.getAmount(),
                lc.getAmount(),
                null,
                lc.getCurrency(),
                lc.getResponsibleId(),
                null,
                lc.getLawyerId(),
                null,
                null,
                lc.getCourtName(),
                lc.getFilingDate(),
                lc.getHearingDate(),
                lc.getResolutionDate(),
                lc.getOutcome(),
                lc.isClosed(),
                0,
                0,
                lc.getCreatedAt(),
                lc.getUpdatedAt(),
                lc.getCreatedBy()
        );
    }
}
