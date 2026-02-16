package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MailTracking;
import com.privod.platform.modules.messaging.domain.MailTrackingStatus;

import java.time.Instant;
import java.util.UUID;

public record MailTrackingResponse(
        UUID id,
        UUID messageId,
        String recipientEmail,
        MailTrackingStatus status,
        String statusDisplayName,
        Instant sentAt,
        Instant deliveredAt,
        Instant openedAt,
        String errorMessage,
        Instant createdAt,
        Instant updatedAt
) {
    public static MailTrackingResponse fromEntity(MailTracking tracking) {
        return new MailTrackingResponse(
                tracking.getId(),
                tracking.getMessageId(),
                tracking.getRecipientEmail(),
                tracking.getStatus(),
                tracking.getStatus().getDisplayName(),
                tracking.getSentAt(),
                tracking.getDeliveredAt(),
                tracking.getOpenedAt(),
                tracking.getErrorMessage(),
                tracking.getCreatedAt(),
                tracking.getUpdatedAt()
        );
    }
}
