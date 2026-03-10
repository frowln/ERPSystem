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
public class BankExportRecordResponse {
    private UUID id;
    private String fileName;
    private String format;
    private String exportDate;
    private int paymentsCount;
    private BigDecimal totalAmount;
}
