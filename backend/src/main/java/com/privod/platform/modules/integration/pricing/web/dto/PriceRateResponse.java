package com.privod.platform.modules.integration.pricing.web.dto;

import com.privod.platform.modules.integration.pricing.domain.PriceRate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record PriceRateResponse(
        UUID id,
        UUID databaseId,
        String code,
        String name,
        String unit,
        BigDecimal laborCost,
        BigDecimal materialCost,
        BigDecimal equipmentCost,
        BigDecimal overheadCost,
        BigDecimal totalCost,
        String category,
        String subcategory,
        Instant createdAt,
        Instant updatedAt
) {
    public static PriceRateResponse fromEntity(PriceRate entity) {
        return new PriceRateResponse(
                entity.getId(),
                entity.getDatabaseId(),
                entity.getCode(),
                entity.getName(),
                entity.getUnit(),
                entity.getLaborCost(),
                entity.getMaterialCost(),
                entity.getEquipmentCost(),
                entity.getOverheadCost(),
                entity.getTotalCost(),
                entity.getCategory(),
                entity.getSubcategory(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
