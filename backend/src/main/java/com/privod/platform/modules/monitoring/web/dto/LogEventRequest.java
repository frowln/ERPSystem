package com.privod.platform.modules.monitoring.web.dto;

import com.privod.platform.modules.monitoring.domain.EventSeverity;
import com.privod.platform.modules.monitoring.domain.SystemEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Map;
import java.util.UUID;

public record LogEventRequest(
        @NotNull(message = "Тип события обязателен")
        SystemEventType eventType,

        @NotNull(message = "Уровень серьёзности обязателен")
        EventSeverity severity,

        @NotBlank(message = "Сообщение обязательно")
        @Size(max = 2000, message = "Сообщение не должно превышать 2000 символов")
        String message,

        Map<String, Object> details,

        @Size(max = 200)
        String source,

        UUID userId
) {
}
