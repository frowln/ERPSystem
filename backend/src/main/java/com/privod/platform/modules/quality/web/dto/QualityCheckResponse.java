package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.CheckResult;
import com.privod.platform.modules.quality.domain.CheckStatus;
import com.privod.platform.modules.quality.domain.CheckType;
import com.privod.platform.modules.quality.domain.QualityCheck;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record QualityCheckResponse(
        UUID id,
        String code,
        UUID projectId,
        UUID taskId,
        UUID specItemId,
        CheckType checkType,
        String checkTypeDisplayName,
        String name,
        String description,
        LocalDate plannedDate,
        LocalDate actualDate,
        UUID inspectorId,
        String inspectorName,
        CheckResult result,
        String resultDisplayName,
        CheckStatus status,
        String statusDisplayName,
        String findings,
        String recommendations,
        List<String> attachmentUrls,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static QualityCheckResponse fromEntity(QualityCheck entity) {
        return new QualityCheckResponse(
                entity.getId(),
                entity.getCode(),
                entity.getProjectId(),
                entity.getTaskId(),
                entity.getSpecItemId(),
                entity.getCheckType(),
                entity.getCheckType().getDisplayName(),
                entity.getName(),
                entity.getDescription(),
                entity.getPlannedDate(),
                entity.getActualDate(),
                entity.getInspectorId(),
                entity.getInspectorName(),
                entity.getResult(),
                entity.getResult().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getFindings(),
                entity.getRecommendations(),
                entity.getAttachmentUrls(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
