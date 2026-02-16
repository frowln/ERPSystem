package com.privod.platform.modules.chatter.web.dto;

import com.privod.platform.modules.chatter.domain.Follower;

import java.time.Instant;
import java.util.UUID;

public record FollowerResponse(
        UUID id,
        String entityType,
        UUID entityId,
        UUID userId,
        String followReason,
        boolean isActive,
        Instant createdAt
) {
    public static FollowerResponse fromEntity(Follower entity) {
        return new FollowerResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getUserId(),
                entity.getFollowReason(),
                entity.isActive(),
                entity.getCreatedAt()
        );
    }
}
