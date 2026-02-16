package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.ClaimStatus;
import com.privod.platform.modules.contractExt.domain.ClaimType;
import com.privod.platform.modules.contractExt.domain.ContractClaim;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ContractClaimResponse(
        UUID id,
        UUID contractId,
        String code,
        ClaimType claimType,
        String claimTypeDisplayName,
        String subject,
        String description,
        BigDecimal amount,
        List<String> evidenceUrls,
        UUID filedById,
        Instant filedAt,
        Instant respondedAt,
        String responseText,
        ClaimStatus status,
        String statusDisplayName,
        Instant resolvedAt,
        String resolutionNotes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ContractClaimResponse fromEntity(ContractClaim entity) {
        return new ContractClaimResponse(
                entity.getId(),
                entity.getContractId(),
                entity.getCode(),
                entity.getClaimType(),
                entity.getClaimType().getDisplayName(),
                entity.getSubject(),
                entity.getDescription(),
                entity.getAmount(),
                entity.getEvidenceUrls(),
                entity.getFiledById(),
                entity.getFiledAt(),
                entity.getRespondedAt(),
                entity.getResponseText(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getResolvedAt(),
                entity.getResolutionNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
