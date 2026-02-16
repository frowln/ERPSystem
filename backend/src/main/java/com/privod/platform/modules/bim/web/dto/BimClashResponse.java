package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.BimClash;
import com.privod.platform.modules.bim.domain.ClashSeverity;
import com.privod.platform.modules.bim.domain.ClashStatus;
import com.privod.platform.modules.bim.domain.ClashType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record BimClashResponse(
        UUID id,
        UUID modelAId,
        UUID modelBId,
        String elementAId,
        String elementBId,
        ClashType clashType,
        String clashTypeDisplayName,
        ClashSeverity severity,
        String severityDisplayName,
        ClashStatus status,
        String statusDisplayName,
        String description,
        Map<String, Object> coordinates,
        UUID resolvedById,
        Instant resolvedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static BimClashResponse fromEntity(BimClash entity) {
        return new BimClashResponse(
                entity.getId(),
                entity.getModelAId(),
                entity.getModelBId(),
                entity.getElementAId(),
                entity.getElementBId(),
                entity.getClashType(),
                entity.getClashType().getDisplayName(),
                entity.getSeverity(),
                entity.getSeverity().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getDescription(),
                entity.getCoordinates(),
                entity.getResolvedById(),
                entity.getResolvedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
