package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.Message;
import com.privod.platform.modules.messaging.domain.MessageType;

import java.time.Instant;
import java.util.UUID;

public record MessageResponse(
        UUID id,
        UUID channelId,
        UUID authorId,
        String authorName,
        String authorAvatarUrl,
        String content,
        MessageType messageType,
        String messageTypeDisplayName,
        UUID parentMessageId,
        Boolean isEdited,
        Instant editedAt,
        Boolean isPinned,
        UUID pinnedBy,
        Instant pinnedAt,
        Integer replyCount,
        Integer reactionCount,
        String attachmentUrl,
        String attachmentName,
        Long attachmentSize,
        String attachmentType,
        Instant createdAt,
        Instant updatedAt
) {
    public static MessageResponse fromEntity(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getChannelId(),
                message.getAuthorId(),
                message.getAuthorName(),
                message.getAuthorAvatarUrl(),
                message.getContent(),
                message.getMessageType(),
                message.getMessageType().getDisplayName(),
                message.getParentMessageId(),
                message.getIsEdited(),
                message.getEditedAt(),
                message.getIsPinned(),
                message.getPinnedBy(),
                message.getPinnedAt(),
                message.getReplyCount(),
                message.getReactionCount(),
                message.getAttachmentUrl(),
                message.getAttachmentName(),
                message.getAttachmentSize(),
                message.getAttachmentType(),
                message.getCreatedAt(),
                message.getUpdatedAt()
        );
    }
}
