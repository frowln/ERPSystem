package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record UpdateFinancingScheduleEntryRequest(
        LocalDate periodDate,
        BigDecimal plannedAmount,
        BigDecimal actualAmount,
        String description
) {
}
