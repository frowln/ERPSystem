package com.privod.platform.modules.esg.web.dto;

import com.privod.platform.modules.esg.domain.EsgMaterialCategory;
import com.privod.platform.modules.esg.domain.MaterialGwpEntry;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record MaterialGwpEntryResponse(
        UUID id,
        EsgMaterialCategory materialCategory,
        String materialCategoryDisplayName,
        String materialSubcategory,
        String name,
        BigDecimal gwpPerUnit,
        String unit,
        String source,
        String country,
        Integer dataYear,
        boolean isVerified,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static MaterialGwpEntryResponse fromEntity(MaterialGwpEntry entity) {
        return new MaterialGwpEntryResponse(
                entity.getId(),
                entity.getMaterialCategory(),
                entity.getMaterialCategory().getDisplayName(),
                entity.getMaterialSubcategory(),
                entity.getName(),
                entity.getGwpPerUnit(),
                entity.getUnit(),
                entity.getSource(),
                entity.getCountry(),
                entity.getDataYear(),
                entity.isVerified(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
