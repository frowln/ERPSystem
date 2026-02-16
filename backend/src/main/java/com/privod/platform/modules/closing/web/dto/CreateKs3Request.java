package com.privod.platform.modules.closing.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateKs3Request(
        @NotBlank(message = "Номер документа обязателен")
        @Size(max = 50, message = "Номер документа не должен превышать 50 символов")
        String number,

        @NotNull(message = "Дата документа обязательна")
        LocalDate documentDate,

        LocalDate periodFrom,

        LocalDate periodTo,

        UUID projectId,

        UUID contractId,

        @Positive(message = "Процент удержания должен быть положительным")
        BigDecimal retentionPercent,

        @Size(max = 5000, message = "Примечания не должны превышать 5000 символов")
        String notes
) {
}
