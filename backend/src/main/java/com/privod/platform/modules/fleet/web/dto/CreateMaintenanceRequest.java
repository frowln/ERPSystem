package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.MaintenanceType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateMaintenanceRequest(
        @NotNull(message = "Идентификатор техники обязателен")
        UUID vehicleId,

        @NotNull(message = "Тип обслуживания обязателен")
        MaintenanceType maintenanceType,

        String description,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        LocalDate endDate,

        @DecimalMin(value = "0", message = "Стоимость не может быть отрицательной")
        BigDecimal cost,

        UUID performedById,

        @Size(max = 300, message = "Наименование подрядчика не должно превышать 300 символов")
        String vendor,

        @DecimalMin(value = "0", message = "Пробег не может быть отрицательным")
        BigDecimal mileageAtService,

        @DecimalMin(value = "0", message = "Моточасы не могут быть отрицательными")
        BigDecimal hoursAtService,

        @DecimalMin(value = "0", message = "Пробег следующего ТО не может быть отрицательным")
        BigDecimal nextServiceMileage,

        @DecimalMin(value = "0", message = "Моточасы следующего ТО не могут быть отрицательными")
        BigDecimal nextServiceHours,

        LocalDate nextServiceDate
) {
}
