package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.project.domain.ProjectHealthStatus;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateProjectUpdateRequest(
        @NotBlank(message = "Заголовок обновления обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        String description,

        UUID authorId,

        ProjectHealthStatus status,

        @Min(value = 0, message = "Прогресс не может быть меньше 0")
        @Max(value = 100, message = "Прогресс не может быть больше 100")
        Integer progressPercentage
) {
}
