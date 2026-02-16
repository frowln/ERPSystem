package com.privod.platform.modules.pmWorkflow.web.dto;

import com.privod.platform.modules.pmWorkflow.domain.IssuePriority;
import com.privod.platform.modules.pmWorkflow.domain.IssueType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateIssueRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Заголовок проблемы обязателен")
        @Size(max = 500, message = "Заголовок не должен превышать 500 символов")
        String title,

        String description,

        IssueType issueType,

        IssuePriority priority,

        UUID assignedToId,

        @NotNull(message = "Идентификатор автора обязателен")
        UUID reportedById,

        LocalDate dueDate,

        String location,

        UUID linkedRfiId,

        UUID linkedSubmittalId,

        String linkedDocumentIds,

        String tags
) {
}
