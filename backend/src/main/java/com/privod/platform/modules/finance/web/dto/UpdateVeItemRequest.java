package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;

public record UpdateVeItemRequest(
        String analogMaterialName,
        String analogBrand,
        String analogManufacturer,
        BigDecimal analogPrice,
        BigDecimal quantity,
        String qualityImpact,
        String reason,
        String status,
        String reviewComment
) {
}
