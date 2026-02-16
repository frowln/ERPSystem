package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.ActOsvidetelstvovanie;
import com.privod.platform.modules.pto.domain.ActOsvidetelstvovanieStatus;
import com.privod.platform.modules.pto.domain.ActResult;
import com.privod.platform.modules.pto.domain.WorkType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ActOsvidetelstvovanieResponse(
        UUID id,
        UUID projectId,
        String code,
        WorkType workType,
        String workTypeDisplayName,
        BigDecimal volume,
        String unit,
        LocalDate startDate,
        LocalDate endDate,
        UUID responsibleId,
        UUID inspectorId,
        ActResult result,
        String resultDisplayName,
        String comments,
        ActOsvidetelstvovanieStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ActOsvidetelstvovanieResponse fromEntity(ActOsvidetelstvovanie entity) {
        return new ActOsvidetelstvovanieResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getCode(),
                entity.getWorkType(),
                entity.getWorkType().getDisplayName(),
                entity.getVolume(),
                entity.getUnit(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getResponsibleId(),
                entity.getInspectorId(),
                entity.getResult(),
                entity.getResult() != null ? entity.getResult().getDisplayName() : null,
                entity.getComments(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
