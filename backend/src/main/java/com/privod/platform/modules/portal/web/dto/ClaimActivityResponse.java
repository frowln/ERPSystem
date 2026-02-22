package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.ClientClaimActivity;

import java.time.Instant;
import java.util.UUID;

public record ClaimActivityResponse(
        UUID id,
        UUID claimId,
        String activityType,
        String authorName,
        String authorType,
        String content,
        String oldValue,
        String newValue,
        Instant createdAt
) {
    public static ClaimActivityResponse fromEntity(ClientClaimActivity activity) {
        return new ClaimActivityResponse(
                activity.getId(),
                activity.getClaimId(),
                activity.getActivityType() != null ? activity.getActivityType().name() : null,
                activity.getAuthorName(),
                activity.getAuthorType() != null ? activity.getAuthorType().name() : null,
                activity.getContent(),
                activity.getOldValue(),
                activity.getNewValue(),
                activity.getCreatedAt()
        );
    }
}
