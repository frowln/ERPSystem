package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record EstimateItemForKs2Response(
        UUID id,
        UUID estimateId,
        Integer sequence,
        String name,
        String unitOfMeasure,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal amount,
        BigDecimal alreadyClosedQuantity,
        BigDecimal remainingQuantity,
        int closedPercent
) {
}
