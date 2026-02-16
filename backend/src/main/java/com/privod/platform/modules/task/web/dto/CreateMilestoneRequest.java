package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateMilestoneRequest(
        @NotBlank(message = "Название вехи обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        UUID projectId,

        @NotNull(message = "Дата вехи обязательна")
        LocalDate dueDate,

        String description
) {
}
