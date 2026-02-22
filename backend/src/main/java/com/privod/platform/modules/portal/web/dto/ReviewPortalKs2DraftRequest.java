package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.NotNull;

public record ReviewPortalKs2DraftRequest(
        @NotNull(message = "Решение обязательно")
        Boolean approved,

        String reviewComment
) {
}
