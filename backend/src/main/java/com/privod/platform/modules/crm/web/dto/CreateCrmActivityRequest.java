package com.privod.platform.modules.crm.web.dto;

import com.privod.platform.modules.crm.domain.CrmActivityType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record CreateCrmActivityRequest(
        @NotNull(message = "Идентификатор лида обязателен")
        UUID leadId,

        @NotNull(message = "Тип активности обязателен")
        CrmActivityType activityType,

        @NotNull(message = "Пользователь обязателен")
        UUID userId,

        @Size(max = 500)
        String summary,

        String notes,

        LocalDateTime scheduledAt
) {
}
