package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;

public record FmSectionSummary(
        String section,
        BigDecimal planned,
        BigDecimal contracted,
        BigDecimal actual
) {
}
