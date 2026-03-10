package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.ChannelMember;
import com.privod.platform.modules.messaging.domain.ChannelMemberRole;

import java.time.Instant;
import java.util.UUID;

public record ChannelMemberResponse(
        UUID id,
        UUID channelId,
        UUID userId,
        String userName,
        ChannelMemberRole role,
        String roleDisplayName,
        Boolean isMuted,
        Instant lastReadAt,
        Integer unreadCount,
        Instant joinedAt,
        String availabilityStatus
) {
    public static ChannelMemberResponse fromEntity(ChannelMember member) {
        return new ChannelMemberResponse(
                member.getId(),
                member.getChannelId(),
                member.getUserId(),
                member.getUserName(),
                member.getRole(),
                member.getRole().getDisplayName(),
                member.getIsMuted(),
                member.getLastReadAt(),
                member.getUnreadCount(),
                member.getJoinedAt(),
                "OFFLINE"
        );
    }

    public static ChannelMemberResponse fromEntityWithStatus(ChannelMember member, String availabilityStatus) {
        return new ChannelMemberResponse(
                member.getId(),
                member.getChannelId(),
                member.getUserId(),
                member.getUserName(),
                member.getRole(),
                member.getRole().getDisplayName(),
                member.getIsMuted(),
                member.getLastReadAt(),
                member.getUnreadCount(),
                member.getJoinedAt(),
                availabilityStatus != null ? availabilityStatus : "OFFLINE"
        );
    }
}
