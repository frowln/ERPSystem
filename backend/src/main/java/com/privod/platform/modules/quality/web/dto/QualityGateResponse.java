package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.QualityGate;
import com.privod.platform.modules.quality.domain.QualityGateStatus;

import java.time.Instant;
import java.util.UUID;

public record QualityGateResponse(
        UUID id,
        UUID projectId,
        UUID wbsNodeId,
        String name,
        String description,
        String requiredDocumentsJson,
        String requiredQualityChecksJson,
        Integer volumeThresholdPercent,
        QualityGateStatus status,
        String statusDisplayName,
        Integer docCompletionPercent,
        Integer qualityCompletionPercent,
        Integer volumeCompletionPercent,
        String blockedReason,
        Instant passedAt,
        UUID passedBy,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static QualityGateResponse fromEntity(QualityGate entity) {
        return new QualityGateResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getWbsNodeId(),
                entity.getName(),
                entity.getDescription(),
                entity.getRequiredDocumentsJson(),
                entity.getRequiredQualityChecksJson(),
                entity.getVolumeThresholdPercent(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getDocCompletionPercent(),
                entity.getQualityCompletionPercent(),
                entity.getVolumeCompletionPercent(),
                entity.getBlockedReason(),
                entity.getPassedAt(),
                entity.getPassedBy(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
