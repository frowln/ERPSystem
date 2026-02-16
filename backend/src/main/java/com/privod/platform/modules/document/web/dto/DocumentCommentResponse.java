package com.privod.platform.modules.document.web.dto;

import com.privod.platform.modules.document.domain.DocumentComment;

import java.time.Instant;
import java.util.UUID;

public record DocumentCommentResponse(
        UUID id,
        UUID documentId,
        UUID authorId,
        String authorName,
        String content,
        Instant createdAt
) {
    public static DocumentCommentResponse fromEntity(DocumentComment comment) {
        return new DocumentCommentResponse(
                comment.getId(),
                comment.getDocumentId(),
                comment.getAuthorId(),
                comment.getAuthorName(),
                comment.getContent(),
                comment.getCreatedAt()
        );
    }
}
