package com.privod.platform.modules.messaging.web.dto;

public record RenderedTemplateResponse(
        String subject,
        String bodyHtml,
        String emailFrom,
        String emailTo,
        String emailCc,
        String replyTo
) {
}
