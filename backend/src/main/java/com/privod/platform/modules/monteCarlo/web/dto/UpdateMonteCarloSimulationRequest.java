package com.privod.platform.modules.monteCarlo.web.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdateMonteCarloSimulationRequest(
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        UUID projectId,

        @Min(value = 100, message = "Количество итераций должно быть не менее 100")
        Integer iterations,

        @DecimalMin(value = "0.01", message = "Уровень доверия должен быть не менее 0.01")
        @DecimalMax(value = "0.99", message = "Уровень доверия должен быть не более 0.99")
        BigDecimal confidenceLevel,

        LocalDate baselineStartDate,

        @Min(value = 1, message = "Базовая длительность должна быть не менее 1 дня")
        Integer baselineDuration,

        String description
) {
}
