package com.privod.platform.modules.integration.sms.web.dto;

import com.privod.platform.modules.integration.sms.domain.SmsChannel;
import com.privod.platform.modules.integration.sms.domain.SmsMessage;
import com.privod.platform.modules.integration.sms.domain.SmsMessageStatus;

import java.time.Instant;
import java.util.UUID;

public record SmsMessageResponse(
        UUID id,
        String phoneNumber,
        String messageText,
        SmsChannel channel,
        String channelDisplayName,
        SmsMessageStatus status,
        String statusDisplayName,
        String errorMessage,
        Instant sentAt,
        Instant deliveredAt,
        String externalId,
        UUID userId,
        String relatedEntityType,
        UUID relatedEntityId,
        Instant createdAt,
        Instant updatedAt
) {
    public static SmsMessageResponse fromEntity(SmsMessage entity) {
        return new SmsMessageResponse(
                entity.getId(),
                entity.getPhoneNumber(),
                entity.getMessageText(),
                entity.getChannel(),
                entity.getChannel().getDisplayName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getErrorMessage(),
                entity.getSentAt(),
                entity.getDeliveredAt(),
                entity.getExternalId(),
                entity.getUserId(),
                entity.getRelatedEntityType(),
                entity.getRelatedEntityId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
