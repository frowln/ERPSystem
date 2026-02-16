package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.ContractGuarantee;
import com.privod.platform.modules.contractExt.domain.GuaranteeStatus;
import com.privod.platform.modules.contractExt.domain.GuaranteeType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ContractGuaranteeResponse(
        UUID id,
        UUID contractId,
        GuaranteeType guaranteeType,
        String guaranteeTypeDisplayName,
        BigDecimal amount,
        String currency,
        String issuedBy,
        LocalDate issuedAt,
        LocalDate expiresAt,
        GuaranteeStatus status,
        String statusDisplayName,
        String documentUrl,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ContractGuaranteeResponse fromEntity(ContractGuarantee entity) {
        return new ContractGuaranteeResponse(
                entity.getId(),
                entity.getContractId(),
                entity.getGuaranteeType(),
                entity.getGuaranteeType().getDisplayName(),
                entity.getAmount(),
                entity.getCurrency(),
                entity.getIssuedBy(),
                entity.getIssuedAt(),
                entity.getExpiresAt(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getDocumentUrl(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
