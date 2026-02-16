package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.SubmittalComment;

import java.time.Instant;
import java.util.UUID;

public record SubmittalCommentResponse(
        UUID id,
        UUID submittalId,
        UUID authorId,
        String content,
        String attachmentUrl,
        Instant createdAt,
        String createdBy
) {
    public static SubmittalCommentResponse fromEntity(SubmittalComment entity) {
        return new SubmittalCommentResponse(
                entity.getId(),
                entity.getSubmittalId(),
                entity.getAuthorId(),
                entity.getContent(),
                entity.getAttachmentUrl(),
                entity.getCreatedAt(),
                entity.getCreatedBy()
        );
    }
}
