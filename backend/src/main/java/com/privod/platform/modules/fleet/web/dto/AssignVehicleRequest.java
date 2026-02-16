package com.privod.platform.modules.fleet.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AssignVehicleRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        UUID operatorId,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        LocalDate endDate,

        @DecimalMin(value = "0", message = "Дневная ставка не может быть отрицательной")
        BigDecimal dailyRate,

        String notes
) {
}
