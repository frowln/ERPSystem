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
public class TreasuryPaymentResponse {
    private UUID id;
    private String date;
    private String counterparty;
    private BigDecimal amount;
    private String type; // "income" or "expense"
    private int priority;
    private String status; // "planned", "approved", "executed", "overdue"
    private String invoiceNumber;
}
