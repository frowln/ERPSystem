package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.BudgetCategory;
import com.privod.platform.modules.finance.domain.BudgetItemDocStatus;
import com.privod.platform.modules.finance.domain.BudgetItemPriceSource;
import com.privod.platform.modules.finance.domain.BudgetItemType;
import com.privod.platform.modules.finance.domain.BudgetItem;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record BudgetItemResponse(
        UUID id,
        UUID budgetId,
        Integer sequence,
        BudgetCategory category,
        String categoryDisplayName,
        String name,
        Boolean section,
        UUID parentId,
        BudgetItemType itemType,
        BigDecimal quantity,
        String unit,
        String disciplineMark,
        BigDecimal costPrice,
        BigDecimal estimatePrice,
        BigDecimal customerPrice,
        BigDecimal salePrice,
        BigDecimal coefficient,
        BigDecimal vatRate,
        BigDecimal vatAmount,
        BigDecimal totalWithVat,
        BudgetItemDocStatus docStatus,
        BudgetItemPriceSource priceSourceType,
        UUID priceSourceId,
        BigDecimal plannedAmount,
        BigDecimal actualAmount,
        BigDecimal committedAmount,
        BigDecimal contractedAmount,
        BigDecimal actSignedAmount,
        BigDecimal invoicedAmount,
        BigDecimal paidAmount,
        BigDecimal remainingAmount,
        BigDecimal marginAmount,
        BigDecimal marginPercent,
        UUID sectionId,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static BudgetItemResponse fromEntity(BudgetItem item) {
        return new BudgetItemResponse(
                item.getId(),
                item.getBudgetId(),
                item.getSequence(),
                item.getCategory(),
                item.getCategory().getDisplayName(),
                item.getName(),
                item.isSection(),
                item.getParentId(),
                item.getItemType(),
                item.getQuantity(),
                item.getUnit(),
                item.getDisciplineMark(),
                item.getCostPrice(),
                item.getEstimatePrice(),
                item.getCustomerPrice(),
                item.getSalePrice(),
                item.getCoefficient(),
                item.getVatRate(),
                item.getVatAmount(),
                item.getTotalWithVat(),
                item.getDocStatus(),
                item.getPriceSourceType(),
                item.getPriceSourceId(),
                item.getPlannedAmount(),
                item.getActualAmount(),
                item.getCommittedAmount(),
                item.getContractedAmount(),
                item.getActSignedAmount(),
                item.getInvoicedAmount(),
                item.getPaidAmount(),
                item.getRemainingAmount(),
                item.getMarginAmount(),
                item.getMarginPercent(),
                item.getSectionId(),
                item.getNotes(),
                item.getCreatedAt(),
                item.getUpdatedAt()
        );
    }
}
