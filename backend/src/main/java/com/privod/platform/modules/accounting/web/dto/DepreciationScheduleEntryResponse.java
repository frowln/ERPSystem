package com.privod.platform.modules.accounting.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * P1-ACC-3: One entry in a fixed asset depreciation schedule.
 */
public record DepreciationScheduleEntryResponse(
        int periodNumber,
        LocalDate periodDate,
        BigDecimal monthlyAmount,
        BigDecimal accumulatedAmount,
        BigDecimal remainingValue
) {}
