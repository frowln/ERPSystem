package com.privod.platform.modules.closing.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record VolumeCheckResultResponse(
        UUID lineId,
        String lineName,
        String unitOfMeasure,
        BigDecimal ks2Quantity,
        BigDecimal estimateQuantity,
        BigDecimal previouslyClosedQuantity,
        BigDecimal remainingQuantity,
        BigDecimal deviation,
        boolean exceeded
) {
}
