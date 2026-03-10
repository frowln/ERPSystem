package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.PpeItem;
import com.privod.platform.modules.safety.domain.PpeItemCategory;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PpeItemResponse(
        UUID id,
        String name,
        String sku,
        PpeItemCategory category,
        String categoryDisplayName,
        String size,
        String certificationStandard,
        Integer totalQuantity,
        Integer availableQuantity,
        Integer minStockLevel,
        boolean lowStock,
        LocalDate expiryDate,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static PpeItemResponse fromEntity(PpeItem entity) {
        return new PpeItemResponse(
                entity.getId(),
                entity.getName(),
                entity.getSku(),
                entity.getCategory(),
                entity.getCategory().getDisplayName(),
                entity.getSize(),
                entity.getCertificationStandard(),
                entity.getTotalQuantity(),
                entity.getAvailableQuantity(),
                entity.getMinStockLevel(),
                entity.getAvailableQuantity() <= entity.getMinStockLevel(),
                entity.getExpiryDate(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
