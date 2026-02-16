package com.privod.platform.modules.ops.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateDispatchOrderRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        UUID vehicleId,
        UUID driverId,

        @Size(max = 500, message = "Пункт погрузки не должен превышать 500 символов")
        String loadingPoint,

        @Size(max = 500, message = "Пункт разгрузки не должен превышать 500 символов")
        String unloadingPoint,

        @Size(max = 300, message = "Наименование материала не должно превышать 300 символов")
        String materialName,

        BigDecimal quantity,

        @Size(max = 30, message = "Единица измерения не должна превышать 30 символов")
        String unit,

        LocalDate scheduledDate,
        String scheduledTime,
        BigDecimal distance,
        String notes
) {
}
