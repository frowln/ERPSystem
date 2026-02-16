package com.privod.platform.modules.procurementExt.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateDispatchOrderRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Номер заявки обязателен")
        String orderNumber,

        UUID vehicleId,

        UUID driverId,

        @Size(max = 500, message = "Точка погрузки не должна превышать 500 символов")
        String loadingPoint,

        @Size(max = 500, message = "Точка разгрузки не должна превышать 500 символов")
        String unloadingPoint,

        @Size(max = 300, message = "Название материала не должно превышать 300 символов")
        String materialName,

        BigDecimal quantity,

        @Size(max = 30, message = "Единица измерения не должна превышать 30 символов")
        String unit,

        LocalDate scheduledDate,

        @Size(max = 10, message = "Время не должно превышать 10 символов")
        String scheduledTime,

        @Size(max = 5000, message = "Примечания не должны превышать 5000 символов")
        String notes
) {
}
