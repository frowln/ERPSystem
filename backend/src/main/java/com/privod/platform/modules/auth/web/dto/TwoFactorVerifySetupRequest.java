package com.privod.platform.modules.auth.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record TwoFactorVerifySetupRequest(
        @NotBlank(message = "Код верификации обязателен")
        @Pattern(regexp = "\\d{6}", message = "Код должен содержать 6 цифр")
        String code
) {
}
