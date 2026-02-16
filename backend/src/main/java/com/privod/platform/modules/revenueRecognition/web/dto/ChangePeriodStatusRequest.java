package com.privod.platform.modules.revenueRecognition.web.dto;

import com.privod.platform.modules.revenueRecognition.domain.PeriodStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ChangePeriodStatusRequest(
        @NotNull(message = "Новый статус обязателен")
        PeriodStatus status,

        UUID userId
) {
}
