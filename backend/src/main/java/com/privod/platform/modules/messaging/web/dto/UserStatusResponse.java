package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.AvailabilityStatus;
import com.privod.platform.modules.messaging.domain.UserStatus;

import java.time.Instant;
import java.util.UUID;

public record UserStatusResponse(
        UUID id,
        UUID userId,
        String statusText,
        String statusEmoji,
        Boolean isOnline,
        Instant lastSeenAt,
        AvailabilityStatus availabilityStatus,
        String availabilityStatusDisplayName,
        Instant updatedAt
) {
    public static UserStatusResponse fromEntity(UserStatus status) {
        return new UserStatusResponse(
                status.getId(),
                status.getUserId(),
                status.getStatusText(),
                status.getStatusEmoji(),
                status.getIsOnline(),
                status.getLastSeenAt(),
                status.getAvailabilityStatus(),
                status.getAvailabilityStatus().getDisplayName(),
                status.getUpdatedAt()
        );
    }
}
