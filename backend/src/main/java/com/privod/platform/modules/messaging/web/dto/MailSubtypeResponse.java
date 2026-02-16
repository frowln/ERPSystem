package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MailSubtype;

import java.time.Instant;
import java.util.UUID;

public record MailSubtypeResponse(
        UUID id,
        String name,
        String description,
        String modelName,
        boolean isDefault,
        boolean isInternal,
        UUID parentId,
        int sequence,
        Instant createdAt,
        Instant updatedAt
) {
    public static MailSubtypeResponse fromEntity(MailSubtype subtype) {
        return new MailSubtypeResponse(
                subtype.getId(),
                subtype.getName(),
                subtype.getDescription(),
                subtype.getModelName(),
                subtype.isDefault(),
                subtype.isInternal(),
                subtype.getParentId(),
                subtype.getSequence(),
                subtype.getCreatedAt(),
                subtype.getUpdatedAt()
        );
    }
}
