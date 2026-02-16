package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.IssueComment;

import java.time.Instant;
import java.util.UUID;

public record IssueCommentResponseDto(
        UUID id,
        UUID issueId,
        UUID authorId,
        String commentText,
        String attachmentIds,
        Instant postedAt,
        Instant createdAt,
        String createdBy
) {
    public static IssueCommentResponseDto fromEntity(IssueComment entity) {
        return new IssueCommentResponseDto(
                entity.getId(),
                entity.getIssueId(),
                entity.getAuthorId(),
                entity.getCommentText(),
                entity.getAttachmentIds(),
                entity.getPostedAt(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
