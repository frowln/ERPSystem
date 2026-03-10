package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TaxDeadlineResponse(
        UUID id,
        String taxType,
        String name,
        LocalDate dueDate,
        BigDecimal amount,
        boolean notificationEnabled
) {
}
