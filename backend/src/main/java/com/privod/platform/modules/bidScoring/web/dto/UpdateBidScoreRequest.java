package com.privod.platform.modules.bidScoring.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateBidScoreRequest(
        @NotNull(message = "Оценка обязательна")
        @DecimalMin(value = "0", message = "Оценка не может быть отрицательной")
        BigDecimal score,

        String comments,

        @Size(max = 500)
        String vendorName,

        UUID scoredById
) {
}
