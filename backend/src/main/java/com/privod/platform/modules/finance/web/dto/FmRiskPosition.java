package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record FmRiskPosition(
        UUID itemId,
        String name,
        String section,
        BigDecimal planned,
        BigDecimal actual,
        BigDecimal overrun,
        BigDecimal overrunPercent
) {
}
