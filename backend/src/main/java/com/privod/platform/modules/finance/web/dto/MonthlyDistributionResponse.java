package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;

public record MonthlyDistributionResponse(
    String month,           // "2025-01"
    BigDecimal planned,
    BigDecimal actual
) {}
