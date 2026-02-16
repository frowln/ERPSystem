package com.privod.platform.modules.safety.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ResolveViolationRequest(
        @NotBlank(message = "Описание устранения нарушения обязательно")
        String resolution
) {
}
