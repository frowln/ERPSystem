package com.privod.platform.modules.integration.telegram.web.dto;

import com.privod.platform.modules.integration.telegram.domain.TelegramSubscription;

import java.time.Instant;
import java.util.UUID;

public record TelegramSubscriptionResponse(
        UUID id,
        UUID userId,
        String chatId,
        boolean notifyProjects,
        boolean notifySafety,
        boolean notifyTasks,
        boolean notifyApprovals,
        boolean active,
        Instant createdAt,
        Instant updatedAt
) {
    public static TelegramSubscriptionResponse fromEntity(TelegramSubscription entity) {
        return new TelegramSubscriptionResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getChatId(),
                entity.isNotifyProjects(),
                entity.isNotifySafety(),
                entity.isNotifyTasks(),
                entity.isNotifyApprovals(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
