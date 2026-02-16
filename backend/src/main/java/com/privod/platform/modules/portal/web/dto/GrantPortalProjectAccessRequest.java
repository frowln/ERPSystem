package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.PortalAccessLevel;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GrantPortalProjectAccessRequest(
        @NotNull(message = "ID пользователя портала обязателен")
        UUID portalUserId,

        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Уровень доступа обязателен")
        PortalAccessLevel accessLevel,

        boolean canViewFinance,
        boolean canViewDocuments,
        boolean canViewSchedule,
        boolean canViewPhotos,

        UUID grantedById
) {
}
