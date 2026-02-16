package com.privod.platform.modules.project.web.dto;

import com.privod.platform.modules.project.domain.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record ChangeStatusRequest(
        @NotNull(message = "New status is required")
        ProjectStatus status,

        String reason
) {
}
