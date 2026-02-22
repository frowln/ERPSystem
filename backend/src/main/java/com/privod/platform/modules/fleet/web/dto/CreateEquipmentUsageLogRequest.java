package com.privod.platform.modules.fleet.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateEquipmentUsageLogRequest(
        @NotNull(message = "Идентификатор техники обязателен")
        UUID vehicleId,

        UUID projectId,
        UUID operatorId,

        @Size(max = 255, message = "Имя оператора не должно превышать 255 символов")
        String operatorName,

        @NotNull(message = "Дата использования обязательна")
        LocalDate usageDate,

        @NotNull(message = "Количество отработанных часов обязательно")
        @DecimalMin(value = "0", message = "Количество часов не может быть отрицательным")
        BigDecimal hoursWorked,

        @DecimalMin(value = "0", message = "Показание счётчика не может быть отрицательным")
        BigDecimal hoursStart,

        @DecimalMin(value = "0", message = "Показание счётчика не может быть отрицательным")
        BigDecimal hoursEnd,

        @DecimalMin(value = "0", message = "Расход топлива не может быть отрицательным")
        BigDecimal fuelConsumed,

        String description,
        String notes
) {
}
