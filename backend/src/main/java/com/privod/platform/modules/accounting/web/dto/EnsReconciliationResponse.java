package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.EnsReconciliation;
import com.privod.platform.modules.accounting.domain.EnsReconciliationStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EnsReconciliationResponse(
        UUID id,
        UUID ensAccountId,
        UUID periodId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal openingBalance,
        BigDecimal expectedAmount,
        BigDecimal actualAmount,
        BigDecimal totalDebits,
        BigDecimal totalCredits,
        BigDecimal closingBalance,
        BigDecimal difference,
        BigDecimal discrepancyAmount,
        EnsReconciliationStatus status,
        String statusDisplayName,
        String notes,
        UUID reconciledById,
        Instant reconciledAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static EnsReconciliationResponse fromEntity(EnsReconciliation entity) {
        return new EnsReconciliationResponse(
                entity.getId(),
                entity.getEnsAccountId(),
                entity.getPeriodId(),
                entity.getPeriodStart(),
                entity.getPeriodEnd(),
                entity.getOpeningBalance(),
                entity.getExpectedAmount(),
                entity.getActualAmount(),
                entity.getTotalDebits(),
                entity.getTotalCredits(),
                entity.getClosingBalance(),
                entity.getDifference(),
                entity.getDiscrepancyAmount(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getNotes(),
                entity.getReconciledById(),
                entity.getReconciledAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
