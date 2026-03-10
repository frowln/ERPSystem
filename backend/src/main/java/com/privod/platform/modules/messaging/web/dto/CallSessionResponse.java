package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.CallSession;
import com.privod.platform.modules.messaging.domain.CallStatus;
import com.privod.platform.modules.messaging.domain.CallType;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CallSessionResponse(
        UUID id,
        String title,
        UUID projectId,
        UUID channelId,
        UUID initiatorId,
        String initiatorName,
        CallType callType,
        CallStatus status,
        String signalingKey,
        Instant startedAt,
        Instant endedAt,
        Integer durationSeconds,
        String metadataJson,
        String inviteToken,
        List<CallParticipantResponse> participants,
        Instant createdAt
) {
    public static CallSessionResponse fromEntity(CallSession session, List<CallParticipantResponse> participants) {
        return new CallSessionResponse(
                session.getId(),
                session.getTitle(),
                session.getProjectId(),
                session.getChannelId(),
                session.getInitiatorId(),
                session.getInitiatorName(),
                session.getCallType(),
                session.getStatus(),
                session.getSignalingKey(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.getDurationSeconds(),
                session.getMetadataJson(),
                session.getInviteToken(),
                participants,
                session.getCreatedAt()
        );
    }
}
