package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.WarehouseLocation;
import com.privod.platform.modules.warehouse.domain.WarehouseLocationType;

import java.time.Instant;
import java.util.UUID;

public record WarehouseLocationResponse(
        UUID id,
        String name,
        String code,
        WarehouseLocationType locationType,
        String locationTypeDisplayName,
        UUID projectId,
        String address,
        UUID responsibleId,
        String responsibleName,
        UUID parentId,
        boolean active,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static WarehouseLocationResponse fromEntity(WarehouseLocation location) {
        return new WarehouseLocationResponse(
                location.getId(),
                location.getName(),
                location.getCode(),
                location.getLocationType(),
                location.getLocationType() != null ? location.getLocationType().getDisplayName() : null,
                location.getProjectId(),
                location.getAddress(),
                location.getResponsibleId(),
                location.getResponsibleName(),
                location.getParentId(),
                location.isActive(),
                location.getCreatedAt(),
                location.getUpdatedAt(),
                location.getCreatedBy()
        );
    }
}
