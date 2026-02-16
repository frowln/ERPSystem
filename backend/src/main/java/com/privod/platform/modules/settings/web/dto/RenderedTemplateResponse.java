package com.privod.platform.modules.settings.web.dto;

public record RenderedTemplateResponse(
        String subject,
        String bodyHtml,
        String bodyText
) {
}
