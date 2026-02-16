package com.privod.platform.modules.design.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record CreateDesignReviewRequest(
        @NotNull(message = "ID версии проекта обязателен")
        UUID designVersionId,

        @NotNull(message = "ID рецензента обязателен")
        UUID reviewerId,

        @Size(max = 255, message = "Имя рецензента не должно превышать 255 символов")
        String reviewerName,

        String comments
) {
}
