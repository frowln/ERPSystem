package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskPriority;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record UpdateTaskTemplateRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        String description,

        TaskPriority defaultPriority,

        @DecimalMin(value = "0", message = "Оценка трудозатрат не может быть отрицательной")
        BigDecimal estimatedHours,

        @Size(max = 100)
        String category,

        String checklistTemplate,

        @Size(max = 500)
        String tags,

        Boolean isActive
) {
}
