package com.privod.platform.modules.integration.telegram.web.dto;

import com.privod.platform.modules.integration.telegram.domain.TelegramMessage;
import com.privod.platform.modules.integration.telegram.domain.TelegramMessageStatus;
import com.privod.platform.modules.integration.telegram.domain.TelegramMessageType;

import java.time.Instant;
import java.util.UUID;

public record TelegramMessageResponse(
        UUID id,
        String chatId,
        String messageText,
        TelegramMessageType messageType,
        String messageTypeDisplayName,
        TelegramMessageStatus status,
        String statusDisplayName,
        String errorMessage,
        Instant sentAt,
        String relatedEntityType,
        UUID relatedEntityId,
        Instant createdAt,
        Instant updatedAt
) {
    public static TelegramMessageResponse fromEntity(TelegramMessage entity) {
        return new TelegramMessageResponse(
                entity.getId(),
                entity.getChatId(),
                entity.getMessageText(),
                entity.getMessageType(),
                entity.getMessageType().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getErrorMessage(),
                entity.getSentAt(),
                entity.getRelatedEntityType(),
                entity.getRelatedEntityId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
