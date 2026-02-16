package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pto.domain.SubmittalType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateSubmittalRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название сабмитала обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        String description,

        SubmittalType submittalType,

        String specSection,

        LocalDate dueDate,

        UUID submittedById,

        UUID ballInCourt,

        Integer leadTime,

        LocalDate requiredDate,

        String linkedDrawingIds,

        String attachmentIds,

        String tags
) {
}
