package com.privod.platform.modules.task.web.dto;

import com.privod.platform.modules.task.domain.TaskPriority;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateTaskRequest(
        @NotBlank(message = "Название задачи обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        String description,

        UUID projectId,

        UUID parentTaskId,

        TaskPriority priority,

        UUID assigneeId,

        @Size(max = 255)
        String assigneeName,

        UUID reporterId,

        @Size(max = 255)
        String reporterName,

        LocalDate plannedStartDate,

        LocalDate plannedEndDate,

        @DecimalMin(value = "0", message = "Оценка трудозатрат не может быть отрицательной")
        BigDecimal estimatedHours,

        @Min(value = 0, message = "Прогресс не может быть меньше 0")
        @Max(value = 100, message = "Прогресс не может быть больше 100")
        Integer progress,

        @Size(max = 100)
        String wbsCode,

        Integer sortOrder,

        UUID specItemId,

        @Size(max = 500)
        String tags,

        String notes
) {
}
