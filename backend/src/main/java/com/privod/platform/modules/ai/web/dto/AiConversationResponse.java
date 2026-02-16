package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiConversation;
import com.privod.platform.modules.ai.domain.ConversationStatus;

import java.time.Instant;
import java.util.UUID;

public record AiConversationResponse(
        UUID id,
        UUID userId,
        UUID projectId,
        String title,
        ConversationStatus status,
        String statusDisplayName,
        Instant lastMessageAt,
        Instant createdAt
) {
    public static AiConversationResponse fromEntity(AiConversation entity) {
        return new AiConversationResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getProjectId(),
                entity.getTitle(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getLastMessageAt(),
                entity.getCreatedAt()
        );
    }
}
