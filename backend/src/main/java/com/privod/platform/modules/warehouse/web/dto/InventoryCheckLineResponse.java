package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.InventoryCheckLine;

import java.math.BigDecimal;
import java.util.UUID;

public record InventoryCheckLineResponse(
        UUID id,
        UUID checkId,
        UUID materialId,
        String materialName,
        BigDecimal expectedQuantity,
        BigDecimal actualQuantity,
        BigDecimal variance,
        String notes
) {
    public static InventoryCheckLineResponse fromEntity(InventoryCheckLine line) {
        return new InventoryCheckLineResponse(
                line.getId(),
                line.getCheckId(),
                line.getMaterialId(),
                line.getMaterialName(),
                line.getExpectedQuantity(),
                line.getActualQuantity(),
                line.getVariance(),
                line.getNotes()
        );
    }
}
