package com.privod.platform.modules.commercialProposal.web.dto;

import com.privod.platform.modules.commercialProposal.domain.CommercialProposal;
import com.privod.platform.modules.commercialProposal.domain.ProposalStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CommercialProposalResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        UUID budgetId,
        UUID specificationId,
        String name,
        ProposalStatus status,
        String statusDisplayName,
        BigDecimal totalCostPrice,
        BigDecimal totalCustomerPrice,
        BigDecimal totalMargin,
        BigDecimal marginPercent,
        UUID createdById,
        UUID approvedById,
        Instant approvedAt,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static CommercialProposalResponse fromEntity(CommercialProposal entity) {
        return new CommercialProposalResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getBudgetId(),
                entity.getSpecificationId(),
                entity.getName(),
                entity.getStatus(),
                entity.getStatus() != null ? entity.getStatus().getDisplayName() : null,
                entity.getTotalCostPrice(),
                entity.getTotalCustomerPrice(),
                entity.getTotalMargin(),
                entity.getMarginPercent(),
                entity.getCreatedById(),
                entity.getApprovedById(),
                entity.getApprovedAt(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
