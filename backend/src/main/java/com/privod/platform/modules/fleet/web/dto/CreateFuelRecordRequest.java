package com.privod.platform.modules.fleet.web.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateFuelRecordRequest(
        @NotNull(message = "Идентификатор техники обязателен")
        UUID vehicleId,

        UUID operatorId,
        UUID projectId,

        @NotNull(message = "Дата заправки обязательна")
        LocalDate fuelDate,

        @NotNull(message = "Количество топлива обязательно")
        @Positive(message = "Количество топлива должно быть положительным")
        BigDecimal quantity,

        @NotNull(message = "Цена за единицу обязательна")
        @DecimalMin(value = "0", message = "Цена за единицу не может быть отрицательной")
        BigDecimal pricePerUnit,

        @DecimalMin(value = "0", message = "Пробег не может быть отрицательным")
        BigDecimal mileageAtFuel,

        @DecimalMin(value = "0", message = "Моточасы не могут быть отрицательными")
        BigDecimal hoursAtFuel,

        @Size(max = 300, message = "Наименование АЗС не должно превышать 300 символов")
        String fuelStation,

        @Size(max = 100, message = "Номер чека не должен превышать 100 символов")
        String receiptNumber
) {
}
