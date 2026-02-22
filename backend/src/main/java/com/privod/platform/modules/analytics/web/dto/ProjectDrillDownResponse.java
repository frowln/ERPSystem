package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ProjectDrillDownResponse(
        UUID projectId,
        String projectName,
        String projectCode,
        String status,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        BigDecimal contractAmount,
        BigDecimal budgetAmount,
        BigDecimal totalInvoiced,
        BigDecimal totalPaid,
        BigDecimal totalSpent,
        BigDecimal cpi,
        BigDecimal spi,
        String healthStatus,
        List<BudgetItemSummary> budgetItems,
        List<RecentTransactionDto> recentTransactions,
        List<EvmDataPointDto> evmHistory
) {

    public record BudgetItemSummary(
            UUID id,
            String name,
            BigDecimal plannedAmount,
            BigDecimal actualAmount,
            BigDecimal committedAmount,
            BigDecimal remainingAmount
    ) {
    }

    public record RecentTransactionDto(
            UUID id,
            String type,
            String number,
            LocalDate date,
            BigDecimal amount,
            String status
    ) {
    }

    public record EvmDataPointDto(
            LocalDate snapshotDate,
            BigDecimal plannedValue,
            BigDecimal earnedValue,
            BigDecimal actualCost,
            BigDecimal cpi,
            BigDecimal spi
    ) {
    }
}
