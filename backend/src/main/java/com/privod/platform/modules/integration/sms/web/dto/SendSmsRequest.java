package com.privod.platform.modules.integration.sms.web.dto;

import com.privod.platform.modules.integration.sms.domain.SmsChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record SendSmsRequest(
        @NotBlank(message = "Номер телефона обязателен")
        @Size(max = 20, message = "Номер телефона не должен превышать 20 символов")
        String phoneNumber,

        @NotBlank(message = "Текст сообщения обязателен")
        @Size(max = 4096, message = "Текст сообщения не должен превышать 4096 символов")
        String messageText,

        SmsChannel channel,

        UUID userId,

        String relatedEntityType,

        UUID relatedEntityId
) {
}
