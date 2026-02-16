package com.privod.platform.modules.support.web.dto;

import com.privod.platform.modules.support.domain.Faq;

import java.time.Instant;
import java.util.UUID;

public record FaqResponse(
        UUID id,
        String question,
        String answer,
        UUID categoryId,
        Integer sortOrder,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static FaqResponse fromEntity(Faq faq) {
        return new FaqResponse(
                faq.getId(),
                faq.getQuestion(),
                faq.getAnswer(),
                faq.getCategoryId(),
                faq.getSortOrder(),
                faq.isActive(),
                faq.getCreatedAt(),
                faq.getUpdatedAt()
        );
    }
}
