package com.privod.platform.modules.specification.web.dto;

import com.privod.platform.modules.specification.domain.AnalogRequestStatus;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record ReviewAnalogRequestRequest(
        @NotNull(message = "Статус решения обязателен")
        AnalogRequestStatus status,

        UUID approvedAnalogId,

        @NotNull(message = "Идентификатор рецензента обязателен")
        UUID approvedById,

        String reviewComment
) {
}
