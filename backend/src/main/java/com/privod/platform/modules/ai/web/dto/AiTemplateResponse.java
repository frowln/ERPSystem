package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiTemplate;

import java.time.Instant;
import java.util.UUID;

public record AiTemplateResponse(
        UUID id,
        String code,
        String name,
        String systemPrompt,
        String category,
        Boolean isActive,
        String model,
        Instant createdAt
) {
    public static AiTemplateResponse fromEntity(AiTemplate entity) {
        return new AiTemplateResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getSystemPrompt(),
                entity.getCategory(),
                entity.getIsActive(),
                entity.getModel(),
                entity.getCreatedAt()
        );
    }
}
