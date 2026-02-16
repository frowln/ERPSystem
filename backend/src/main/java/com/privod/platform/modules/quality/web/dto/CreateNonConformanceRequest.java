package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.NonConformanceSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateNonConformanceRequest(
        UUID qualityCheckId,

        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Степень тяжести обязательна")
        NonConformanceSeverity severity,

        @NotBlank(message = "Описание несоответствия обязательно")
        String description,

        String rootCause,
        String correctiveAction,
        String preventiveAction,
        UUID responsibleId,
        LocalDate dueDate,
        BigDecimal cost
) {
}
