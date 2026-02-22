package com.privod.platform.modules.monteCarlo.web.dto;

import java.math.BigDecimal;

public record EacTrajectoryPoint(
        String date,
        BigDecimal eac,
        BigDecimal cpi,
        BigDecimal spi
) {
}
