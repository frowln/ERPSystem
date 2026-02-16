package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.MaterialAnalog;
import com.privod.platform.modules.specification.domain.QualityRating;
import com.privod.platform.modules.specification.domain.SubstitutionType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record MaterialAnalogResponse(
        UUID id,
        UUID originalMaterialId,
        String originalMaterialName,
        UUID analogMaterialId,
        String analogMaterialName,
        SubstitutionType substitutionType,
        String substitutionTypeDisplayName,
        BigDecimal priceRatio,
        QualityRating qualityRating,
        String qualityRatingDisplayName,
        UUID approvedById,
        LocalDateTime approvedAt,
        String conditions,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MaterialAnalogResponse fromEntity(MaterialAnalog entity) {
        return new MaterialAnalogResponse(
                entity.getId(),
                entity.getOriginalMaterialId(),
                entity.getOriginalMaterialName(),
                entity.getAnalogMaterialId(),
                entity.getAnalogMaterialName(),
                entity.getSubstitutionType(),
                entity.getSubstitutionType().getDisplayName(),
                entity.getPriceRatio(),
                entity.getQualityRating(),
                entity.getQualityRating().getDisplayName(),
                entity.getApprovedById(),
                entity.getApprovedAt(),
                entity.getConditions(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
