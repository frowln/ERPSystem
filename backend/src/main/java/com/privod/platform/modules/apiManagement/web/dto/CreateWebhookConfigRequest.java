package com.privod.platform.modules.apiManagement.web.dto;

import com.privod.platform.modules.apiManagement.domain.RetryPolicy;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateWebhookConfigRequest(
        @NotBlank(message = "Название вебхука обязательно")
        @Size(max = 255, message = "Название не должно превышать 255 символов")
        String name,

        @NotBlank(message = "URL вебхука обязателен")
        @Size(max = 1000, message = "URL не должен превышать 1000 символов")
        String url,

        String secret,
        String events,
        RetryPolicy retryPolicy
) {
}
