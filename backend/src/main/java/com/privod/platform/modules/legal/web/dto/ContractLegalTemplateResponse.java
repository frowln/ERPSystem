package com.privod.platform.modules.legal.web.dto;

import com.privod.platform.modules.legal.domain.ContractLegalTemplate;
import com.privod.platform.modules.legal.domain.LegalTemplateType;

import java.time.Instant;
import java.util.UUID;

public record ContractLegalTemplateResponse(
        UUID id,
        String name,
        String code,
        LegalTemplateType templateType,
        String templateTypeDisplayName,
        String category,
        String status,
        String content,
        String variables,
        boolean active,
        int templateVersion,
        int version,
        int clauseCount,
        String description,
        String authorName,
        Instant lastUsedDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static ContractLegalTemplateResponse fromEntity(ContractLegalTemplate t) {
        String status = t.isActive() ? "ACTIVE" : "ARCHIVED";
        String code = t.getTemplateType() != null
                ? t.getTemplateType().name().substring(0, Math.min(3, t.getTemplateType().name().length()))
                        + "-" + String.format("%03d", t.getTemplateVersion())
                : "TPL-" + String.format("%03d", t.getTemplateVersion());

        // Estimate clause count from content paragraphs
        int clauseCount = 0;
        if (t.getContent() != null && !t.getContent().isEmpty()) {
            String[] paragraphs = t.getContent().split("\n\n");
            clauseCount = Math.max(1, paragraphs.length);
        }

        // Short description from first 200 chars of content
        String description = null;
        if (t.getContent() != null && !t.getContent().isEmpty()) {
            description = t.getContent().length() > 200
                    ? t.getContent().substring(0, 200) + "..."
                    : t.getContent();
        }

        return new ContractLegalTemplateResponse(
                t.getId(),
                t.getName(),
                code,
                t.getTemplateType(),
                t.getTemplateType() != null ? t.getTemplateType().getDisplayName() : "",
                t.getCategory(),
                status,
                t.getContent(),
                t.getVariables(),
                t.isActive(),
                t.getTemplateVersion(),
                t.getTemplateVersion(),
                clauseCount,
                description,
                "Администратор",
                t.getUpdatedAt(),
                t.getCreatedAt(),
                t.getUpdatedAt()
        );
    }
}
