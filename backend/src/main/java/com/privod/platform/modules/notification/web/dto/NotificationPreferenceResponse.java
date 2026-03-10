package com.privod.platform.modules.notification.web.dto;

import com.privod.platform.modules.notification.domain.NotificationCategory;
import com.privod.platform.modules.notification.domain.NotificationChannel;
import com.privod.platform.modules.notification.domain.NotificationPreference;

import java.time.Instant;
import java.util.UUID;

public record NotificationPreferenceResponse(
        UUID id,
        UUID userId,
        UUID organizationId,
        NotificationChannel channel,
        String channelDisplayName,
        NotificationCategory category,
        String categoryDisplayName,
        boolean enabled,
        Instant createdAt,
        Instant updatedAt
) {
    public static NotificationPreferenceResponse fromEntity(NotificationPreference entity) {
        return new NotificationPreferenceResponse(
                entity.getId(),
                entity.getUserId(),
                entity.getOrganizationId(),
                entity.getChannel(),
                entity.getChannel().getDisplayName(),
                entity.getCategory(),
                entity.getCategory().getDisplayName(),
                entity.isEnabled(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
