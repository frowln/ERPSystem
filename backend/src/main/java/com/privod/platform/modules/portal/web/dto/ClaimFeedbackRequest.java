package com.privod.platform.modules.portal.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ClaimFeedbackRequest(
        @NotNull(message = "Поле 'принято' обязательно")
        Boolean accepted,

        String feedback,

        @Min(value = 1, message = "Оценка должна быть от 1 до 5")
        @Max(value = 5, message = "Оценка должна быть от 1 до 5")
        Integer rating
) {
}
