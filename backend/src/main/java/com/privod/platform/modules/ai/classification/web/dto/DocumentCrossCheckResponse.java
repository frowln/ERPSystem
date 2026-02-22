package com.privod.platform.modules.ai.classification.web.dto;

import com.privod.platform.modules.ai.classification.domain.CrossCheckStatus;
import com.privod.platform.modules.ai.classification.domain.CrossCheckType;
import com.privod.platform.modules.ai.classification.domain.DocumentCrossCheck;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record DocumentCrossCheckResponse(
        UUID id,
        UUID sourceDocumentId,
        UUID targetDocumentId,
        CrossCheckType checkType,
        String checkTypeDisplayName,
        CrossCheckStatus status,
        String statusDisplayName,
        Map<String, Object> discrepancyDetailsJson,
        Instant checkedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DocumentCrossCheckResponse fromEntity(DocumentCrossCheck entity) {
        return new DocumentCrossCheckResponse(
                entity.getId(),
                entity.getSourceDocumentId(),
                entity.getTargetDocumentId(),
                entity.getCheckType(),
                entity.getCheckType().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getDiscrepancyDetailsJson(),
                entity.getCheckedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
