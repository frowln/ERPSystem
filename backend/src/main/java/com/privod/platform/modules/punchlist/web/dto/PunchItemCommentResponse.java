package com.privod.platform.modules.punchlist.web.dto;

import com.privod.platform.modules.punchlist.domain.PunchItemComment;

import java.time.Instant;
import java.util.UUID;

public record PunchItemCommentResponse(
        UUID id,
        UUID punchItemId,
        UUID authorId,
        String content,
        String attachmentUrl,
        Instant createdAt
) {
    public static PunchItemCommentResponse fromEntity(PunchItemComment comment) {
        return new PunchItemCommentResponse(
                comment.getId(),
                comment.getPunchItemId(),
                comment.getAuthorId(),
                comment.getContent(),
                comment.getAttachmentUrl(),
                comment.getCreatedAt()
        );
    }
}
