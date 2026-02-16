package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.HiddenWorkAct;
import com.privod.platform.modules.pto.domain.HiddenWorkActStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record HiddenWorkActResponse(
        UUID id,
        UUID projectId,
        LocalDate date,
        String workDescription,
        String location,
        UUID inspectorId,
        UUID contractorId,
        HiddenWorkActStatus status,
        String statusDisplayName,
        String photoIds,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static HiddenWorkActResponse fromEntity(HiddenWorkAct entity) {
        return new HiddenWorkActResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getDate(),
                entity.getWorkDescription(),
                entity.getLocation(),
                entity.getInspectorId(),
                entity.getContractorId(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getPhotoIds(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
