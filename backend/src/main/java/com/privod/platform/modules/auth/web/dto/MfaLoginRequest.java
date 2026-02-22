package com.privod.platform.modules.auth.web.dto;

import jakarta.validation.constraints.NotBlank;

public record MfaLoginRequest(
        @NotBlank(message = "MFA challenge token обязателен")
        String mfaChallengeToken,

        @NotBlank(message = "Код верификации обязателен")
        String code
) {
}
