package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.ContractSupplement;
import com.privod.platform.modules.contractExt.domain.SupplementStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ContractSupplementResponse(
        UUID id,
        UUID contractId,
        String number,
        LocalDate supplementDate,
        String reason,
        String description,
        BigDecimal amountChange,
        BigDecimal newTotalAmount,
        Integer deadlineChange,
        LocalDate newDeadline,
        SupplementStatus status,
        String statusDisplayName,
        Instant signedAt,
        List<String> signatories,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ContractSupplementResponse fromEntity(ContractSupplement entity) {
        return new ContractSupplementResponse(
                entity.getId(),
                entity.getContractId(),
                entity.getNumber(),
                entity.getSupplementDate(),
                entity.getReason(),
                entity.getDescription(),
                entity.getAmountChange(),
                entity.getNewTotalAmount(),
                entity.getDeadlineChange(),
                entity.getNewDeadline(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getSignedAt(),
                entity.getSignatories(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
