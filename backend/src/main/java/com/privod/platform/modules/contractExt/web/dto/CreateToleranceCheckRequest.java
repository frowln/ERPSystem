package com.privod.platform.modules.contractExt.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateToleranceCheckRequest(
        @NotNull(message = "ID допуска обязателен")
        UUID toleranceId,

        @NotNull(message = "Измеренное значение обязательно")
        BigDecimal measuredValue,

        UUID measuredById,

        @Size(max = 500)
        String location,

        String notes,

        @Size(max = 1000)
        String evidenceUrl
) {
}
