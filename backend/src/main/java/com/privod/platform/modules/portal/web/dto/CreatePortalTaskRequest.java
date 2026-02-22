package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalTaskPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreatePortalTaskRequest(
        @NotNull(message = "ID пользователя портала обязателен")
        UUID portalUserId,

        UUID projectId,

        @NotBlank(message = "Название задачи обязательно")
        String title,

        String description,
        PortalTaskPriority priority,
        LocalDate dueDate
) {
}
