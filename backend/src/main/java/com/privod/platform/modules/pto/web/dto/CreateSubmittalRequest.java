package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.SubmittalType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateSubmittalRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        @NotNull(message = "Тип передачи обязателен")
        SubmittalType submittalType,

        String description,

        UUID submittedById,

        LocalDate dueDate
) {
}
