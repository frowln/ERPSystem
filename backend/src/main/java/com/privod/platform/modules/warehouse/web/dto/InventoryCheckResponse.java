package com.privod.platform.modules.warehouse.web.dto;

import com.privod.platform.modules.warehouse.domain.InventoryCheck;
import com.privod.platform.modules.warehouse.domain.InventoryCheckStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record InventoryCheckResponse(
        UUID id,
        String name,
        LocalDate checkDate,
        UUID locationId,
        UUID projectId,
        InventoryCheckStatus status,
        String statusDisplayName,
        UUID responsibleId,
        String responsibleName,
        String notes,
        List<InventoryCheckLineResponse> lines,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static InventoryCheckResponse fromEntity(InventoryCheck check) {
        return fromEntity(check, null);
    }

    public static InventoryCheckResponse fromEntity(InventoryCheck check, List<InventoryCheckLineResponse> lines) {
        return new InventoryCheckResponse(
                check.getId(),
                check.getName(),
                check.getCheckDate(),
                check.getLocationId(),
                check.getProjectId(),
                check.getStatus(),
                check.getStatus() != null ? check.getStatus().getDisplayName() : null,
                check.getResponsibleId(),
                check.getResponsibleName(),
                check.getNotes(),
                lines,
                check.getCreatedAt(),
                check.getUpdatedAt(),
                check.getCreatedBy()
        );
    }
}
