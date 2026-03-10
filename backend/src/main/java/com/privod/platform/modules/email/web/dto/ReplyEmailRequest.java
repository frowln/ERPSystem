package com.privod.platform.modules.email.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ReplyEmailRequest(
        @NotBlank(message = "Тело ответа обязательно")
        String bodyHtml,

        boolean replyAll
) {
}
