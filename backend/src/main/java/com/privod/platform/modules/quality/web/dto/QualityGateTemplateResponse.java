package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.QualityGateTemplate;

import java.time.Instant;
import java.util.UUID;

public record QualityGateTemplateResponse(
        UUID id,
        UUID projectTemplateId,
        String name,
        String description,
        String wbsLevelPattern,
        String requiredDocumentsJson,
        String requiredQualityChecksJson,
        Integer volumeThresholdPercent,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static QualityGateTemplateResponse fromEntity(QualityGateTemplate entity) {
        return new QualityGateTemplateResponse(
                entity.getId(),
                entity.getProjectTemplateId(),
                entity.getName(),
                entity.getDescription(),
                entity.getWbsLevelPattern(),
                entity.getRequiredDocumentsJson(),
                entity.getRequiredQualityChecksJson(),
                entity.getVolumeThresholdPercent(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
