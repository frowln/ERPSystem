package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.DocumentClassification;
import com.privod.platform.modules.cde.domain.DocumentContainer;
import com.privod.platform.modules.cde.domain.DocumentLifecycleState;

import java.time.Instant;
import java.util.UUID;

public record DocumentContainerResponse(
        UUID id,
        UUID projectId,
        String documentNumber,
        String title,
        String description,
        DocumentClassification classification,
        String classificationDisplayName,
        DocumentLifecycleState lifecycleState,
        String lifecycleStateDisplayName,
        String discipline,
        String zone,
        String level,
        String originatorCode,
        String typeCode,
        UUID currentRevisionId,
        String metadata,
        String tags,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DocumentContainerResponse fromEntity(DocumentContainer entity) {
        return new DocumentContainerResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getDocumentNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getClassification(),
                entity.getClassification() != null ? entity.getClassification().getDisplayName() : null,
                entity.getLifecycleState(),
                entity.getLifecycleState().getDisplayName(),
                entity.getDiscipline(),
                entity.getZone(),
                entity.getLevel(),
                entity.getOriginatorCode(),
                entity.getTypeCode(),
                entity.getCurrentRevisionId(),
                entity.getMetadata(),
                entity.getTags(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
