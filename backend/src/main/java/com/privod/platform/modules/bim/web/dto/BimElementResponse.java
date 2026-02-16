package com.privod.platform.modules.bim.web.dto;

import com.privod.platform.modules.bim.domain.BimElement;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record BimElementResponse(
        UUID id,
        UUID modelId,
        String elementId,
        String ifcType,
        String name,
        Map<String, Object> properties,
        Map<String, Object> geometry,
        String floor,
        String zone,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static BimElementResponse fromEntity(BimElement entity) {
        return new BimElementResponse(
                entity.getId(),
                entity.getModelId(),
                entity.getElementId(),
                entity.getIfcType(),
                entity.getName(),
                entity.getProperties(),
                entity.getGeometry(),
                entity.getFloor(),
                entity.getZone(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
