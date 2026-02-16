package com.privod.platform.modules.support.web.dto;

import com.privod.platform.modules.support.domain.KnowledgeBase;

import java.time.Instant;
import java.util.UUID;

public record KnowledgeBaseResponse(
        UUID id,
        String code,
        String title,
        String content,
        UUID categoryId,
        String tags,
        Integer views,
        boolean isPublished,
        UUID authorId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static KnowledgeBaseResponse fromEntity(KnowledgeBase kb) {
        return new KnowledgeBaseResponse(
                kb.getId(),
                kb.getCode(),
                kb.getTitle(),
                kb.getContent(),
                kb.getCategoryId(),
                kb.getTags(),
                kb.getViews(),
                kb.isPublished(),
                kb.getAuthorId(),
                kb.getCreatedAt(),
                kb.getUpdatedAt(),
                kb.getCreatedBy()
        );
    }
}
