package com.privod.platform.modules.integration.sms.web.dto;

import com.privod.platform.modules.integration.sms.domain.SmsChannel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record BroadcastSmsRequest(
        @NotEmpty(message = "Список номеров не может быть пустым")
        List<@NotBlank @Size(max = 20) String> phoneNumbers,

        @NotBlank(message = "Текст сообщения обязателен")
        @Size(max = 4096, message = "Текст сообщения не должен превышать 4096 символов")
        String messageText,

        SmsChannel channel
) {
}
