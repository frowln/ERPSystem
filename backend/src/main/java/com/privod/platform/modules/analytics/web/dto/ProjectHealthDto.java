package com.privod.platform.modules.analytics.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ProjectHealthDto(
        UUID projectId,
        String projectName,
        BigDecimal cpi,
        BigDecimal spi,
        String healthStatus,
        BigDecimal contractAmount,
        BigDecimal budgetAmount,
        BigDecimal spentAmount,
        LocalDate scheduledCompletion,
        LocalDate forecastCompletion
) {
}
