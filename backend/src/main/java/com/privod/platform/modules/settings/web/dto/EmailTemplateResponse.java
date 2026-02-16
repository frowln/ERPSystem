package com.privod.platform.modules.settings.web.dto;

import com.privod.platform.modules.settings.domain.EmailTemplate;
import com.privod.platform.modules.settings.domain.EmailTemplateCategory;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record EmailTemplateResponse(
        UUID id,
        String code,
        String name,
        String subject,
        String bodyHtml,
        String bodyText,
        EmailTemplateCategory category,
        String categoryDisplayName,
        List<String> variables,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static EmailTemplateResponse fromEntity(EmailTemplate template) {
        return new EmailTemplateResponse(
                template.getId(),
                template.getCode(),
                template.getName(),
                template.getSubject(),
                template.getBodyHtml(),
                template.getBodyText(),
                template.getCategory(),
                template.getCategory().getDisplayName(),
                template.getVariables(),
                template.isActive(),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
