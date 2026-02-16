package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalUserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePortalUserStatusRequest(
        @NotNull(message = "Статус обязателен")
        PortalUserStatus status
) {
}
