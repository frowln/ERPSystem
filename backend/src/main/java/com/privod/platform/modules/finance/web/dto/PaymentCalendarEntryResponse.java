package com.privod.platform.modules.finance.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentCalendarEntryResponse {
    private String date;
    private String description;
    private BigDecimal amount;
    private String type;
}
