package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.CallParticipant;
import com.privod.platform.modules.messaging.domain.CallParticipantStatus;

import java.time.Instant;
import java.util.UUID;

public record CallParticipantResponse(
        UUID id,
        UUID callSessionId,
        UUID userId,
        String userName,
        CallParticipantStatus status,
        Instant joinedAt,
        Instant leftAt,
        Boolean muted,
        Boolean videoEnabled
) {
    public static CallParticipantResponse fromEntity(CallParticipant entity) {
        return new CallParticipantResponse(
                entity.getId(),
                entity.getCallSessionId(),
                entity.getUserId(),
                entity.getUserName(),
                entity.getParticipantStatus(),
                entity.getJoinedAt(),
                entity.getLeftAt(),
                entity.getIsMuted(),
                entity.getIsVideoEnabled()
        );
    }
}
