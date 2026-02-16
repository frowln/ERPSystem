package com.privod.platform.modules.estimate.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateVersionRequest(
        @NotBlank(message = "Причина версионирования обязательна")
        @Size(max = 50, message = "Причина не должна превышать 50 символов")
        String reason,

        String comment
) {
}
