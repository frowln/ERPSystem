package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.auth.domain.MfaMethod;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record EnableMfaRequest(
        @NotNull(message = "Идентификатор пользователя обязателен")
        UUID userId,

        @NotNull(message = "Метод MFA обязателен")
        MfaMethod method
) {
}
