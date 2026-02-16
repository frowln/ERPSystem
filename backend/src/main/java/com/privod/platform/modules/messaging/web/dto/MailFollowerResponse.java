package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MailFollower;

import java.time.Instant;
import java.util.UUID;

public record MailFollowerResponse(
        UUID id,
        String modelName,
        UUID recordId,
        UUID userId,
        UUID channelId,
        String subtypeIds,
        Instant createdAt,
        Instant updatedAt
) {
    public static MailFollowerResponse fromEntity(MailFollower follower) {
        return new MailFollowerResponse(
                follower.getId(),
                follower.getModelName(),
                follower.getRecordId(),
                follower.getUserId(),
                follower.getChannelId(),
                follower.getSubtypeIds(),
                follower.getCreatedAt(),
                follower.getUpdatedAt()
        );
    }
}
