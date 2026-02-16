package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.PenaltyType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateSlaRequest(
        @NotNull(message = "ID договора обязателен")
        UUID contractId,

        @NotBlank(message = "Метрика обязательна")
        @Size(max = 200)
        String metric,

        @NotNull(message = "Целевое значение обязательно")
        BigDecimal targetValue,

        @NotBlank(message = "Единица измерения обязательна")
        @Size(max = 50)
        String unit,

        @Size(max = 50)
        String measurementPeriod,

        BigDecimal penaltyAmount,

        PenaltyType penaltyType
) {
}
