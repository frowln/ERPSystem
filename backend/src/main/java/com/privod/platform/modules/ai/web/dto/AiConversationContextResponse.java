package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiContextType;
import com.privod.platform.modules.ai.domain.AiConversationContext;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AiConversationContextResponse(
        UUID id,
        UUID conversationId,
        AiContextType contextType,
        String contextTypeDisplayName,
        UUID entityId,
        String entityName,
        Map<String, Object> contextDataJson,
        Instant createdAt
) {
    public static AiConversationContextResponse fromEntity(AiConversationContext entity) {
        return new AiConversationContextResponse(
                entity.getId(),
                entity.getConversationId(),
                entity.getContextType(),
                entity.getContextType().getDisplayName(),
                entity.getEntityId(),
                entity.getEntityName(),
                entity.getContextDataJson(),
                entity.getCreatedAt()
        );
    }
}
