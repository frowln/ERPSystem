package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiPromptCategory;
import com.privod.platform.modules.ai.domain.AiPromptTemplate;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AiPromptTemplateResponse(
        UUID id,
        UUID organizationId,
        String name,
        AiPromptCategory category,
        String categoryDisplayName,
        String promptTextRu,
        String promptTextEn,
        Map<String, Object> variablesJson,
        Boolean isSystem,
        Instant createdAt,
        Instant updatedAt
) {
    public static AiPromptTemplateResponse fromEntity(AiPromptTemplate entity) {
        return new AiPromptTemplateResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getName(),
                entity.getCategory(),
                entity.getCategory().getDisplayName(),
                entity.getPromptTextRu(),
                entity.getPromptTextEn(),
                entity.getVariablesJson(),
                entity.getIsSystem(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
