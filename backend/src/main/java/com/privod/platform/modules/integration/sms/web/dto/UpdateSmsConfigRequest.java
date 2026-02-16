package com.privod.platform.modules.integration.sms.web.dto;

import com.privod.platform.modules.integration.sms.domain.SmsProvider;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateSmsConfigRequest(
        @NotNull(message = "Провайдер обязателен")
        SmsProvider provider,

        @Size(max = 1000, message = "URL API не должен превышать 1000 символов")
        String apiUrl,

        @Size(max = 500, message = "API-ключ не должен превышать 500 символов")
        String apiKey,

        @Size(max = 50, message = "Имя отправителя не должно превышать 50 символов")
        String senderName,

        boolean enabled,

        boolean whatsappEnabled
) {
}
