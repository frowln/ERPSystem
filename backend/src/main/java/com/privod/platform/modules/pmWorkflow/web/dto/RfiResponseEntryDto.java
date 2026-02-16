package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.RfiResponse;

import java.time.Instant;
import java.util.UUID;

public record RfiResponseEntryDto(
        UUID id,
        UUID rfiId,
        UUID responderId,
        String responseText,
        String attachmentIds,
        Boolean isOfficial,
        Instant respondedAt,
        Instant createdAt,
        String createdBy
) {
    public static RfiResponseEntryDto fromEntity(RfiResponse entity) {
        return new RfiResponseEntryDto(
                entity.getId(),
                entity.getRfiId(),
                entity.getResponderId(),
                entity.getResponseText(),
                entity.getAttachmentIds(),
                entity.getIsOfficial(),
                entity.getRespondedAt(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
