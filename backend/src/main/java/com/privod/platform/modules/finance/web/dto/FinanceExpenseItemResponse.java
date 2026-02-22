package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.BudgetCategory;
import com.privod.platform.modules.finance.domain.BudgetItem;
import com.privod.platform.modules.finance.domain.BudgetItemDocStatus;
import com.privod.platform.modules.finance.domain.BudgetItemPriceSource;
import com.privod.platform.modules.finance.domain.BudgetItemType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Budget item enriched with contract and budget/project context for the finance expenses endpoint.
 */
public record FinanceExpenseItemResponse(
        // BudgetItem core fields
        UUID id,
        UUID budgetId,
        UUID parentId,
        Integer sequence,
        boolean section,
        BudgetCategory category,
        String categoryDisplayName,
        BudgetItemType itemType,
        String name,
        BigDecimal quantity,
        String unit,
        // Price chain
        BigDecimal costPrice,
        BigDecimal estimatePrice,
        BigDecimal coefficient,
        BigDecimal salePrice,
        BigDecimal vatRate,
        BigDecimal vatAmount,
        BigDecimal totalWithVat,
        // Aggregate amounts
        BigDecimal plannedAmount,
        BigDecimal contractedAmount,
        BigDecimal actSignedAmount,
        BigDecimal invoicedAmount,
        BigDecimal paidAmount,
        BigDecimal actualAmount,
        BigDecimal committedAmount,
        BigDecimal remainingAmount,
        // Status & links
        BudgetItemDocStatus docStatus,
        BudgetItemPriceSource priceSourceType,
        UUID priceSourceId,
        String notes,
        String disciplineMark,
        Instant createdAt,
        Instant updatedAt,
        // Contract context (first/primary linked contract)
        UUID contractId,
        String contractName,
        String contractNumber,
        String contractStatus,
        String contractPartnerName,
        // Budget/project context
        String budgetName,
        UUID projectId,
        String projectName
) {
    /**
     * Factory method for cases with contract information.
     */
    public static FinanceExpenseItemResponse of(BudgetItem item,
                                                String budgetName,
                                                UUID projectId,
                                                String projectName,
                                                UUID contractId,
                                                String contractName,
                                                String contractNumber,
                                                String contractStatus,
                                                String contractPartnerName) {
        return new FinanceExpenseItemResponse(
                item.getId(),
                item.getBudgetId(),
                item.getParentId(),
                item.getSequence(),
                item.isSection(),
                item.getCategory(),
                item.getCategory() != null ? item.getCategory().getDisplayName() : null,
                item.getItemType(),
                item.getName(),
                item.getQuantity(),
                item.getUnit(),
                item.getCostPrice(),
                item.getEstimatePrice(),
                item.getCoefficient(),
                item.getSalePrice(),
                item.getVatRate(),
                item.getVatAmount(),
                item.getTotalWithVat(),
                item.getPlannedAmount(),
                item.getContractedAmount(),
                item.getActSignedAmount(),
                item.getInvoicedAmount(),
                item.getPaidAmount(),
                item.getActualAmount(),
                item.getCommittedAmount(),
                item.getRemainingAmount(),
                item.getDocStatus(),
                item.getPriceSourceType(),
                item.getPriceSourceId(),
                item.getNotes(),
                item.getDisciplineMark(),
                item.getCreatedAt(),
                item.getUpdatedAt(),
                contractId,
                contractName,
                contractNumber,
                contractStatus,
                contractPartnerName,
                budgetName,
                projectId,
                projectName
        );
    }
}
