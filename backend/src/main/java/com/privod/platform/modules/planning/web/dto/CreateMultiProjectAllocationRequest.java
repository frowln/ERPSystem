package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.MultiProjectResourceType;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateMultiProjectAllocationRequest(
        @NotNull(message = "Тип ресурса обязателен")
        MultiProjectResourceType resourceType,

        @NotNull(message = "ID ресурса обязателен")
        UUID resourceId,

        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate endDate,

        @Min(value = 1, message = "Процент распределения должен быть от 1 до 100")
        @Max(value = 100, message = "Процент распределения должен быть от 1 до 100")
        Integer allocationPercent,

        @Size(max = 255, message = "Роль не должна превышать 255 символов")
        String role,

        @Size(max = 5000, message = "Заметки не должны превышать 5000 символов")
        String notes
) {
}
