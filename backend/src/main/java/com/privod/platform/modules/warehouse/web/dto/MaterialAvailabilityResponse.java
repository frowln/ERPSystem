package com.privod.platform.modules.warehouse.web.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public record MaterialAvailabilityResponse(
        UUID materialId,
        String materialName,
        BigDecimal totalQuantity,
        BigDecimal totalReserved,
        BigDecimal totalAvailable,
        List<StockEntryResponse> stockByLocation
) {
}
