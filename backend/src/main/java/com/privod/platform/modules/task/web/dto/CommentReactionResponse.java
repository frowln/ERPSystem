package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskCommentReaction;

import java.time.Instant;
import java.util.UUID;

public record CommentReactionResponse(
        UUID id,
        UUID commentId,
        UUID userId,
        String userName,
        String emoji,
        Instant createdAt
) {
    public static CommentReactionResponse fromEntity(TaskCommentReaction reaction) {
        return new CommentReactionResponse(
                reaction.getId(),
                reaction.getCommentId(),
                reaction.getUserId(),
                reaction.getUserName(),
                reaction.getEmoji(),
                reaction.getCreatedAt()
        );
    }
}
