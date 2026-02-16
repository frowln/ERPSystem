package com.privod.platform.modules.warehouse.web.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record LowStockAlertResponse(
        UUID stockEntryId,
        UUID materialId,
        String materialName,
        UUID locationId,
        BigDecimal currentQuantity,
        BigDecimal minStockLevel,
        BigDecimal deficit
) {
}
