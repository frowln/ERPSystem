package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiMessage;
import com.privod.platform.modules.ai.domain.MessageRole;

import java.time.Instant;
import java.util.UUID;

public record AiMessageResponse(
        UUID id,
        UUID conversationId,
        MessageRole role,
        String roleDisplayName,
        String content,
        Integer tokensUsed,
        String model,
        Instant createdAt
) {
    public static AiMessageResponse fromEntity(AiMessage entity) {
        return new AiMessageResponse(
                entity.getId(),
                entity.getConversationId(),
                entity.getRole(),
                entity.getRole().getDisplayName(),
                entity.getContent(),
                entity.getTokensUsed(),
                entity.getModel(),
                entity.getCreatedAt()
        );
    }
}
