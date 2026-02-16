package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.WorkPermit;
import com.privod.platform.modules.pto.domain.WorkPermitStatus;
import com.privod.platform.modules.pto.domain.WorkType;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public record WorkPermitResponse(
        UUID id,
        UUID projectId,
        String code,
        WorkType workType,
        String workTypeDisplayName,
        String location,
        LocalDate startDate,
        LocalDate endDate,
        WorkPermitStatus status,
        String statusDisplayName,
        UUID issuedById,
        UUID approvedById,
        Map<String, Object> safetyMeasures,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static WorkPermitResponse fromEntity(WorkPermit entity) {
        return new WorkPermitResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getCode(),
                entity.getWorkType(),
                entity.getWorkType().getDisplayName(),
                entity.getLocation(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getIssuedById(),
                entity.getApprovedById(),
                entity.getSafetyMeasures(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
