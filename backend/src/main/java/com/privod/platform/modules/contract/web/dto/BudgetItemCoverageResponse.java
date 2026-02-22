package com.privod.platform.modules.contract.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record BudgetItemCoverageResponse(
        UUID budgetItemId,
        BigDecimal totalQuantity,
        BigDecimal allocatedQuantity,
        BigDecimal coveragePercent,
        BigDecimal totalAmount,
        BigDecimal allocatedAmount,
        BigDecimal amountCoveragePercent,
        int contractCount,
        List<ContractAllocation> contracts
) {
    public record ContractAllocation(
            UUID contractId,
            String contractNumber,
            String contractName,
            String partnerName,
            BigDecimal allocatedQuantity,
            BigDecimal allocatedAmount
    ) {}
}
