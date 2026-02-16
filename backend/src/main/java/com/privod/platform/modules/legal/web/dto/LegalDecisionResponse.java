package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.DecisionType;
import com.privod.platform.modules.legal.domain.LegalDecision;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LegalDecisionResponse(
        UUID id,
        UUID caseId,
        LocalDate decisionDate,
        DecisionType decisionType,
        String decisionTypeDisplayName,
        String summary,
        BigDecimal amount,
        boolean enforceable,
        LocalDate enforcementDeadline,
        String fileUrl,
        Instant createdAt
) {
    public static LegalDecisionResponse fromEntity(LegalDecision d) {
        return new LegalDecisionResponse(
                d.getId(),
                d.getCaseId(),
                d.getDecisionDate(),
                d.getDecisionType(),
                d.getDecisionType().getDisplayName(),
                d.getSummary(),
                d.getAmount(),
                d.isEnforceable(),
                d.getEnforcementDeadline(),
                d.getFileUrl(),
                d.getCreatedAt()
        );
    }
}
