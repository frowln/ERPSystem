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
public class FactoringCalcResultResponse {
    private UUID invoiceId;
    private String invoiceNumber;
    private BigDecimal faceValue;
    private int daysUntilPayment;
    private BigDecimal factoringRate;
    private BigDecimal commission;
    private BigDecimal discount;
    private BigDecimal netProceeds;
}
