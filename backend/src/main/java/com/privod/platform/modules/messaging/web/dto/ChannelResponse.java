package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.Channel;
import com.privod.platform.modules.messaging.domain.ChannelType;

import java.time.Instant;
import java.util.UUID;

public record ChannelResponse(
        UUID id,
        String code,
        String name,
        String description,
        ChannelType channelType,
        String channelTypeDisplayName,
        String avatarUrl,
        UUID creatorId,
        UUID projectId,
        Integer memberCount,
        Instant lastMessageAt,
        Boolean isPinned,
        Boolean isArchived,
        Instant createdAt,
        Instant updatedAt,
        String createdBy,
        // DM-specific fields
        UUID otherUserId,
        String otherUserName,
        String otherUserAvatarUrl
) {
    public static ChannelResponse fromEntity(Channel channel) {
        return new ChannelResponse(
                channel.getId(),
                channel.getCode(),
                channel.getName(),
                channel.getDescription(),
                channel.getChannelType(),
                channel.getChannelType().getDisplayName(),
                channel.getAvatarUrl(),
                channel.getCreatorId(),
                channel.getProjectId(),
                channel.getMemberCount(),
                channel.getLastMessageAt(),
                channel.getIsPinned(),
                channel.getIsArchived(),
                channel.getCreatedAt(),
                channel.getUpdatedAt(),
                channel.getCreatedBy(),
                null, null, null
        );
    }

    public static ChannelResponse fromEntityWithDm(Channel channel, UUID otherUserId, String otherUserName, String otherUserAvatarUrl) {
        return new ChannelResponse(
                channel.getId(),
                channel.getCode(),
                channel.getName(),
                channel.getDescription(),
                channel.getChannelType(),
                channel.getChannelType().getDisplayName(),
                channel.getAvatarUrl(),
                channel.getCreatorId(),
                channel.getProjectId(),
                channel.getMemberCount(),
                channel.getLastMessageAt(),
                channel.getIsPinned(),
                channel.getIsArchived(),
                channel.getCreatedAt(),
                channel.getUpdatedAt(),
                channel.getCreatedBy(),
                otherUserId, otherUserName, otherUserAvatarUrl
        );
    }
}
