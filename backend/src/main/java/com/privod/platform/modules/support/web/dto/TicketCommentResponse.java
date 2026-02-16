package com.privod.platform.modules.support.web.dto;

import com.privod.platform.modules.support.domain.TicketComment;

import java.time.Instant;
import java.util.UUID;

public record TicketCommentResponse(
        UUID id,
        UUID ticketId,
        UUID authorId,
        String content,
        boolean isInternal,
        String attachmentUrls,
        Instant createdAt
) {
    public static TicketCommentResponse fromEntity(TicketComment comment) {
        return new TicketCommentResponse(
                comment.getId(),
                comment.getTicketId(),
                comment.getAuthorId(),
                comment.getContent(),
                comment.isInternal(),
                comment.getAttachmentUrls(),
                comment.getCreatedAt()
        );
    }
}
