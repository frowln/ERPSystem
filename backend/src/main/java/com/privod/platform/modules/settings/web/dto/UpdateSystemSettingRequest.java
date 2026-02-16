package com.privod.platform.modules.settings.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateSystemSettingRequest(
        @NotBlank(message = "Значение настройки обязательно")
        @Size(max = 10000, message = "Значение не должно превышать 10000 символов")
        String value
) {
}
