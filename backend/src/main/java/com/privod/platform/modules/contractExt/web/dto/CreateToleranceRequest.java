package com.privod.platform.modules.contractExt.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record CreateToleranceRequest(
        UUID projectId,

        @NotBlank(message = "Вид работ обязателен")
        @Size(max = 200)
        String workType,

        @NotBlank(message = "Параметр обязателен")
        @Size(max = 200)
        String parameter,

        @NotNull(message = "Номинальное значение обязательно")
        BigDecimal nominalValue,

        @NotBlank(message = "Единица измерения обязательна")
        @Size(max = 50)
        String unit,

        @NotNull(message = "Минимальное отклонение обязательно")
        BigDecimal minDeviation,

        @NotNull(message = "Максимальное отклонение обязательно")
        BigDecimal maxDeviation,

        @Size(max = 200)
        String measurementMethod,

        @Size(max = 200)
        String referenceStandard
) {
}
