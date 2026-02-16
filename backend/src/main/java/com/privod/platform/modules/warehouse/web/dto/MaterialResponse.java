package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.Material;
import com.privod.platform.modules.warehouse.domain.MaterialCategory;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MaterialResponse(
        UUID id,
        String name,
        String code,
        MaterialCategory category,
        String categoryDisplayName,
        String unitOfMeasure,
        String description,
        BigDecimal minStockLevel,
        BigDecimal currentPrice,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MaterialResponse fromEntity(Material material) {
        return new MaterialResponse(
                material.getId(),
                material.getName(),
                material.getCode(),
                material.getCategory(),
                material.getCategory() != null ? material.getCategory().getDisplayName() : null,
                material.getUnitOfMeasure(),
                material.getDescription(),
                material.getMinStockLevel(),
                material.getCurrentPrice(),
                material.isActive(),
                material.getCreatedAt(),
                material.getUpdatedAt(),
                material.getCreatedBy()
        );
    }
}
