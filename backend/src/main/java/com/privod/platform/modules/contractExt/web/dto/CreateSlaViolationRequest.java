package com.privod.platform.modules.contractExt.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateSlaViolationRequest(
        @NotNull(message = "ID SLA обязателен")
        UUID slaId,

        @NotNull(message = "Дата нарушения обязательна")
        LocalDate violationDate,

        @NotNull(message = "Фактическое значение обязательно")
        BigDecimal actualValue,

        BigDecimal penaltyAmount
) {
}
