package com.privod.platform.modules.chatter.web.dto;

import com.privod.platform.modules.chatter.domain.Comment;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CommentResponse(
        UUID id,
        String entityType,
        UUID entityId,
        UUID authorId,
        String content,
        List<String> attachmentUrls,
        UUID parentCommentId,
        List<UUID> mentionedUserIds,
        boolean isInternal,
        Instant createdAt,
        Instant updatedAt
) {
    public static CommentResponse fromEntity(Comment entity) {
        return new CommentResponse(
                entity.getId(),
                entity.getEntityType(),
                entity.getEntityId(),
                entity.getAuthorId(),
                entity.getContent(),
                entity.getAttachmentUrls(),
                entity.getParentCommentId(),
                entity.getMentionedUserIds(),
                entity.isInternal(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
