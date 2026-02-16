package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.StockMovementLine;

import java.math.BigDecimal;
import java.util.UUID;

public record StockMovementLineResponse(
        UUID id,
        UUID movementId,
        UUID materialId,
        String materialName,
        Integer sequence,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        String unitOfMeasure,
        String notes
) {
    public static StockMovementLineResponse fromEntity(StockMovementLine line) {
        return new StockMovementLineResponse(
                line.getId(),
                line.getMovementId(),
                line.getMaterialId(),
                line.getMaterialName(),
                line.getSequence(),
                line.getQuantity(),
                line.getUnitPrice(),
                line.getTotalPrice(),
                line.getUnitOfMeasure(),
                line.getNotes()
        );
    }
}
