package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.ActivityCategory;
import com.privod.platform.modules.messaging.domain.ActivityDecorationType;
import com.privod.platform.modules.messaging.domain.ActivityDelayUnit;
import com.privod.platform.modules.messaging.domain.MailActivityType;

import java.time.Instant;
import java.util.UUID;

public record MailActivityTypeResponse(
        UUID id,
        String name,
        ActivityCategory category,
        String categoryDisplayName,
        int delayCount,
        ActivityDelayUnit delayUnit,
        String delayUnitDisplayName,
        String icon,
        ActivityDecorationType decorationType,
        Instant createdAt,
        Instant updatedAt
) {
    public static MailActivityTypeResponse fromEntity(MailActivityType type) {
        return new MailActivityTypeResponse(
                type.getId(),
                type.getName(),
                type.getCategory(),
                type.getCategory().getDisplayName(),
                type.getDelayCount(),
                type.getDelayUnit(),
                type.getDelayUnit().getDisplayName(),
                type.getIcon(),
                type.getDecorationType(),
                type.getCreatedAt(),
                type.getUpdatedAt()
        );
    }
}
