package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ResolveClaimRequest(
        @NotBlank(message = "Описание решения обязательно")
        String resolution
) {
}
