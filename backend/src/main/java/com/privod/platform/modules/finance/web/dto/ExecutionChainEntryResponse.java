package com.privod.platform.modules.finance.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionChainEntryResponse {
    private UUID id;
    private String name;
    private String stage;
    private BigDecimal estimateAmount;
    private BigDecimal budgetAmount;
    private BigDecimal ks2Amount;
    private BigDecimal invoicedAmount;
    private BigDecimal paidAmount;
    private String status;
}
