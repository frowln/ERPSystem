package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MessageReaction;

import java.time.Instant;
import java.util.UUID;

public record ReactionResponse(
        UUID id,
        UUID messageId,
        UUID userId,
        String userName,
        String emoji,
        Instant createdAt
) {
    public static ReactionResponse fromEntity(MessageReaction reaction) {
        return new ReactionResponse(
                reaction.getId(),
                reaction.getMessageId(),
                reaction.getUserId(),
                reaction.getUserName(),
                reaction.getEmoji(),
                reaction.getCreatedAt()
        );
    }
}
