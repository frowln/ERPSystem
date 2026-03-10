package com.privod.platform.modules.finance.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionChainSummaryResponse {
    private UUID projectId;
    private String projectName;
    private BigDecimal totalEstimate;
    private BigDecimal totalBudget;
    private BigDecimal totalKs2;
    private BigDecimal totalInvoiced;
    private BigDecimal totalPaid;
    private List<ExecutionChainEntryResponse> items;
}
