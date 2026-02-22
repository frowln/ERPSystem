package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;

public record CashPositionDto(
        BigDecimal totalAR,
        BigDecimal totalAP,
        BigDecimal netCash,
        BigDecimal arBucket0_30,
        BigDecimal arBucket31_60,
        BigDecimal arBucket61_90,
        BigDecimal arBucket90Plus
) {
}
