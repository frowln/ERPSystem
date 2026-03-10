package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record Ks6aEntryResponse(
        UUID ks2Id,
        String ks2Number,
        LocalDate documentDate,
        UUID contractId,
        String workName,
        String unitOfMeasure,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal amount,
        String status,
        int month,
        int year
) {
}
