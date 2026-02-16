package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.StockEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StockEntryResponse(
        UUID id,
        UUID materialId,
        String materialName,
        UUID locationId,
        BigDecimal quantity,
        BigDecimal reservedQuantity,
        BigDecimal availableQuantity,
        BigDecimal lastPricePerUnit,
        BigDecimal totalValue,
        Instant createdAt,
        Instant updatedAt
) {
    public static StockEntryResponse fromEntity(StockEntry entry) {
        return new StockEntryResponse(
                entry.getId(),
                entry.getMaterialId(),
                entry.getMaterialName(),
                entry.getLocationId(),
                entry.getQuantity(),
                entry.getReservedQuantity(),
                entry.getAvailableQuantity(),
                entry.getLastPricePerUnit(),
                entry.getTotalValue(),
                entry.getCreatedAt(),
                entry.getUpdatedAt()
        );
    }
}
