package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskComment;

import java.time.Instant;
import java.util.UUID;

public record TaskCommentResponse(
        UUID id,
        UUID taskId,
        UUID authorId,
        String authorName,
        String content,
        Instant createdAt
) {
    public static TaskCommentResponse fromEntity(TaskComment comment) {
        return new TaskCommentResponse(
                comment.getId(),
                comment.getTaskId(),
                comment.getAuthorId(),
                comment.getAuthorName(),
                comment.getContent(),
                comment.getCreatedAt()
        );
    }
}
