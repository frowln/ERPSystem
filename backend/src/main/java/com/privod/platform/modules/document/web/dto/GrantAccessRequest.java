package com.privod.platform.modules.document.web.dto;

import com.privod.platform.modules.document.domain.AccessLevel;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record GrantAccessRequest(
        @NotNull(message = "Идентификатор пользователя обязателен")
        UUID userId,

        @NotNull(message = "Уровень доступа обязателен")
        AccessLevel accessLevel,

        UUID grantedById,

        String grantedByName
) {
}
