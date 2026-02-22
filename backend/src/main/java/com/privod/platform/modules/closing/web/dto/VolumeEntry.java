package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record VolumeEntry(
        UUID specItemId,
        String workDescription,
        String unit,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal total
) {
}
