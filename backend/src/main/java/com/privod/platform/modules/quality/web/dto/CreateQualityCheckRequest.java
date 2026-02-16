package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.CheckType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateQualityCheckRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        UUID taskId,

        UUID specItemId,

        @NotNull(message = "Тип проверки обязателен")
        CheckType checkType,

        @NotBlank(message = "Наименование проверки обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        String description,

        LocalDate plannedDate,

        UUID inspectorId,
        String inspectorName,

        List<String> attachmentUrls
) {
}
