package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalTaskStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePortalTaskStatusRequest(
        @NotNull(message = "Статус обязателен")
        PortalTaskStatus status,

        String completionNote
) {
}
