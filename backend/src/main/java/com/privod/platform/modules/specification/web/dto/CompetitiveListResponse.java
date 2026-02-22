package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.CompetitiveList;
import com.privod.platform.modules.specification.domain.CompetitiveListStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CompetitiveListResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        UUID specificationId,
        String name,
        CompetitiveListStatus status,
        String statusDisplayName,
        int minProposalsRequired,
        UUID createdById,
        UUID decidedById,
        Instant decidedAt,
        UUID budgetItemId,
        BigDecimal bestPrice,
        String bestVendorName,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static CompetitiveListResponse fromEntity(CompetitiveList entity) {
        return new CompetitiveListResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getSpecificationId(),
                entity.getName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getMinProposalsRequired(),
                entity.getCreatedById(),
                entity.getDecidedById(),
                entity.getDecidedAt(),
                entity.getBudgetItemId(),
                entity.getBestPrice(),
                entity.getBestVendorName(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
