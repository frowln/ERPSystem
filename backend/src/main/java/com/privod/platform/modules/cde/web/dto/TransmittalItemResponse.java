package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.TransmittalItem;

import java.time.Instant;
import java.util.UUID;

public record TransmittalItemResponse(
        UUID id,
        UUID transmittalId,
        UUID documentContainerId,
        UUID revisionId,
        String notes,
        Boolean responseRequired,
        String responseText,
        Instant respondedAt,
        UUID respondedById,
        Integer sortOrder,
        Instant createdAt,
        Instant updatedAt
) {
    public static TransmittalItemResponse fromEntity(TransmittalItem entity) {
        return new TransmittalItemResponse(
                entity.getId(),
                entity.getTransmittalId(),
                entity.getDocumentContainerId(),
                entity.getRevisionId(),
                entity.getNotes(),
                entity.getResponseRequired(),
                entity.getResponseText(),
                entity.getRespondedAt(),
                entity.getRespondedById(),
                entity.getSortOrder(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
