package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.DeclarationStatus;
import com.privod.platform.modules.accounting.domain.DeclarationType;
import com.privod.platform.modules.accounting.domain.TaxDeclaration;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record TaxDeclarationResponse(
        UUID id,
        DeclarationType declarationType,
        String declarationTypeDisplayName,
        UUID periodId,
        DeclarationStatus status,
        String statusDisplayName,
        BigDecimal amount,
        Instant submittedAt,
        Instant acceptedAt,
        String fileUrl,
        String notes,
        Instant createdAt,
        String createdBy
) {
    public static TaxDeclarationResponse fromEntity(TaxDeclaration entity) {
        return new TaxDeclarationResponse(
                entity.getId(),
                entity.getDeclarationType(),
                entity.getDeclarationType().getDisplayName(),
                entity.getPeriodId(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getAmount(),
                entity.getSubmittedAt(),
                entity.getAcceptedAt(),
                entity.getFileUrl(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
