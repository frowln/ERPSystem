package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MailTemplate;

import java.time.Instant;
import java.util.UUID;

public record MailTemplateResponse(
        UUID id,
        String name,
        String modelName,
        String subject,
        String bodyHtml,
        String emailFrom,
        String emailTo,
        String emailCc,
        String replyTo,
        boolean isActive,
        String lang,
        Instant createdAt,
        Instant updatedAt
) {
    public static MailTemplateResponse fromEntity(MailTemplate template) {
        return new MailTemplateResponse(
                template.getId(),
                template.getName(),
                template.getModelName(),
                template.getSubject(),
                template.getBodyHtml(),
                template.getEmailFrom(),
                template.getEmailTo(),
                template.getEmailCc(),
                template.getReplyTo(),
                template.isActive(),
                template.getLang(),
                template.getCreatedAt(),
                template.getUpdatedAt()
        );
    }
}
