package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.RfiPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateRfiRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Тема RFI обязательна")
        @Size(max = 500, message = "Тема не должна превышать 500 символов")
        String subject,

        @NotBlank(message = "Вопрос RFI обязателен")
        String question,

        RfiPriority priority,

        UUID assignedToId,

        UUID responsibleId,

        LocalDate dueDate,

        Boolean costImpact,

        Boolean scheduleImpact,

        UUID relatedDrawingId,

        String relatedSpecSection,

        String distributionList,

        String linkedDocumentIds,

        String tags
) {
}
