package com.privod.platform.modules.commercialProposal.web.dto;

import com.privod.platform.modules.commercialProposal.domain.CommercialProposalItem;
import com.privod.platform.modules.commercialProposal.domain.ProposalItemStatus;
import com.privod.platform.modules.finance.domain.BudgetItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CommercialProposalItemResponse(
        UUID id,
        UUID proposalId,
        UUID budgetItemId,
        String budgetItemName,
        String budgetItemUnit,
        String disciplineMark,
        String itemType,
        UUID selectedInvoiceLineId,
        UUID estimateItemId,
        UUID competitiveListEntryId,
        UUID competitiveListId,
        UUID specItemId,
        BigDecimal unitPrice,
        String unit,
        String vendorName,
        BigDecimal tradingCoefficient,
        BigDecimal costPrice,
        BigDecimal quantity,
        BigDecimal totalCost,
        ProposalItemStatus status,
        String statusDisplayName,
        UUID approvedById,
        Instant approvedAt,
        String rejectionReason,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static CommercialProposalItemResponse fromEntity(CommercialProposalItem entity) {
        return fromEntity(entity, null);
    }

    public static CommercialProposalItemResponse fromEntity(CommercialProposalItem entity, BudgetItem budgetItem) {
        return new CommercialProposalItemResponse(
                entity.getId(),
                entity.getProposalId(),
                entity.getBudgetItemId(),
                budgetItem != null ? budgetItem.getName() : null,
                budgetItem != null ? budgetItem.getUnit() : null,
                budgetItem != null ? budgetItem.getDisciplineMark() : null,
                entity.getItemType(),
                entity.getSelectedInvoiceLineId(),
                entity.getEstimateItemId(),
                entity.getCompetitiveListEntryId(),
                entity.getCompetitiveListId(),
                entity.getSpecItemId(),
                entity.getUnitPrice(),
                entity.getUnit(),
                entity.getVendorName(),
                entity.getTradingCoefficient(),
                entity.getCostPrice(),
                entity.getQuantity(),
                entity.getTotalCost(),
                entity.getStatus(),
                entity.getStatus() != null ? entity.getStatus().getDisplayName() : null,
                entity.getApprovedById(),
                entity.getApprovedAt(),
                entity.getRejectionReason(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
