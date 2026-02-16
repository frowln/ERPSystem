package com.privod.platform.modules.notification.web.dto;

import com.privod.platform.modules.notification.domain.NotificationType;
import com.privod.platform.modules.notification.domain.TargetType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

public record CreateBatchRequest(
        @NotBlank(message = "Заголовок уведомления обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        @NotBlank(message = "Сообщение уведомления обязательно")
        String message,

        @NotNull(message = "Тип уведомления обязателен")
        NotificationType notificationType,

        @NotNull(message = "Тип получателей обязателен")
        TargetType targetType,

        Map<String, Object> targetFilter,
        UUID createdById
) {
}
