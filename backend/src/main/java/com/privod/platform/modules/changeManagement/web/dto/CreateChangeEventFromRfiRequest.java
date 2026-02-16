package com.privod.platform.modules.changeManagement.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateChangeEventFromRfiRequest(
        @NotNull(message = "Идентификатор RFI обязателен")
        UUID rfiId,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        String title,

        String description,

        @NotNull(message = "Идентификатор инициатора обязателен")
        UUID identifiedById,

        @NotNull(message = "Дата выявления обязательна")
        LocalDate identifiedDate,

        BigDecimal estimatedCostImpact,

        Integer estimatedScheduleImpact,

        UUID contractId
) {
}
