package com.privod.platform.modules.contract.web.dto;

import com.privod.platform.modules.contract.domain.ContractBudgetItem;
import com.privod.platform.modules.finance.domain.BudgetItem;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ContractBudgetItemResponse(
        UUID id,
        UUID contractId,
        UUID budgetItemId,
        BigDecimal allocatedQuantity,
        BigDecimal allocatedAmount,
        String notes,
        String budgetItemName,
        String budgetItemUnit,
        String disciplineMark,
        BigDecimal coveragePercent,
        BigDecimal totalQuantity,
        Instant createdAt,
        Instant updatedAt
) {
    public static ContractBudgetItemResponse fromEntity(ContractBudgetItem e) {
        return fromEntity(e, null);
    }

    public static ContractBudgetItemResponse fromEntity(ContractBudgetItem e, BudgetItem budgetItem) {
        return new ContractBudgetItemResponse(
                e.getId(), e.getContractId(), e.getBudgetItemId(),
                e.getAllocatedQuantity(), e.getAllocatedAmount(),
                e.getNotes(),
                budgetItem != null ? budgetItem.getName() : e.getBudgetItemName(),
                budgetItem != null ? budgetItem.getUnit() : null,
                budgetItem != null ? budgetItem.getDisciplineMark() : null,
                e.getCoveragePercent(),
                e.getTotalQuantity(),
                e.getCreatedAt(), e.getUpdatedAt()
        );
    }
}
