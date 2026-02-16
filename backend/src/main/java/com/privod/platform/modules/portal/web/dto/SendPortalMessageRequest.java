package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendPortalMessageRequest(
        UUID toPortalUserId,
        UUID toInternalUserId,

        UUID projectId,

        @NotBlank(message = "Тема сообщения обязательна")
        @Size(max = 500, message = "Тема не должна превышать 500 символов")
        String subject,

        @NotBlank(message = "Текст сообщения обязателен")
        String content,

        UUID parentMessageId
) {
}
