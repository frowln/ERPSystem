package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.EnsOperation;
import com.privod.platform.modules.accounting.domain.EnsOperationStatus;
import com.privod.platform.modules.accounting.domain.EnsOperationType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record EnsOperationResponse(
        UUID id,
        UUID ensAccountId,
        LocalDate operationDate,
        EnsOperationType operationType,
        String operationTypeDisplayName,
        String taxType,
        BigDecimal amount,
        String description,
        String documentNumber,
        LocalDate documentDate,
        EnsOperationStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static EnsOperationResponse fromEntity(EnsOperation entity) {
        return new EnsOperationResponse(
                entity.getId(),
                entity.getEnsAccountId(),
                entity.getOperationDate(),
                entity.getOperationType(),
                entity.getOperationType().getDisplayName(),
                entity.getTaxType(),
                entity.getAmount(),
                entity.getDescription(),
                entity.getDocumentNumber(),
                entity.getDocumentDate(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
