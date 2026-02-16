package com.privod.platform.modules.messaging.web.dto;

import com.privod.platform.modules.messaging.domain.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendMessageRequest(
        @NotBlank(message = "Текст сообщения обязателен")
        @Size(max = 10000, message = "Текст сообщения не должен превышать 10000 символов")
        String content,

        MessageType messageType,

        UUID parentMessageId,

        String attachmentUrl,

        @Size(max = 500, message = "Имя вложения не должно превышать 500 символов")
        String attachmentName,

        Long attachmentSize,

        @Size(max = 100, message = "Тип вложения не должен превышать 100 символов")
        String attachmentType
) {
}
