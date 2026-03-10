package com.privod.platform.modules.closing.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateCorrectionActRequest(
        @NotNull(message = "ID исходного КС-2 обязателен")
        UUID originalKs2Id,

        LocalDate documentDate,

        BigDecimal correctionAmount,

        String reason
) {
}
