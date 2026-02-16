package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.auth.domain.MfaMethod;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record VerifyMfaRequest(
        @NotNull(message = "Идентификатор пользователя обязателен")
        UUID userId,

        @NotNull(message = "Метод MFA обязателен")
        MfaMethod method,

        @NotBlank(message = "Код верификации обязателен")
        String code
) {
}
