package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.EdoAction;
import com.privod.platform.modules.russianDoc.domain.EdoExchangeLog;

import java.time.Instant;
import java.util.UUID;

public record EdoExchangeLogResponse(
        UUID id,
        UUID edoDocumentId,
        EdoAction action,
        String actionDisplayName,
        UUID performedById,
        Instant performedAt,
        String details,
        String externalId,
        Instant createdAt
) {
    public static EdoExchangeLogResponse fromEntity(EdoExchangeLog entity) {
        return new EdoExchangeLogResponse(
                entity.getId(),
                entity.getEdoDocumentId(),
                entity.getAction(),
                entity.getAction().getDisplayName(),
                entity.getPerformedById(),
                entity.getPerformedAt(),
                entity.getDetails(),
                entity.getExternalId(),
                entity.getCreatedAt()
        );
    }
}
