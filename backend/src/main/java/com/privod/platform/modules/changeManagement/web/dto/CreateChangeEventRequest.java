package com.privod.platform.modules.changeManagement.web.dto;

import com.privod.platform.modules.changeManagement.domain.ChangeEventSource;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateChangeEventRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название события изменения обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        String description,

        ChangeEventSource source,

        @NotNull(message = "Идентификатор инициатора обязателен")
        UUID identifiedById,

        @NotNull(message = "Дата выявления обязательна")
        LocalDate identifiedDate,

        BigDecimal estimatedCostImpact,

        Integer estimatedScheduleImpact,

        UUID linkedRfiId,

        UUID linkedIssueId,

        UUID contractId,

        String tags
) {
}
