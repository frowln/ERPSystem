package com.privod.platform.modules.warehouse.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateInterSiteTransferRequest(
        @NotNull(message = "Дата перемещения обязательна")
        LocalDate movementDate,

        @NotNull(message = "Исходный склад обязателен")
        UUID sourceLocationId,

        @NotNull(message = "Склад назначения обязателен")
        UUID destinationLocationId,

        UUID sourceProjectId,

        UUID destinationProjectId,

        UUID responsibleId,

        String responsibleName,

        String notes,

        @NotEmpty(message = "Необходимо указать хотя бы один материал")
        @Valid
        List<TransferLine> lines
) {
    public record TransferLine(
            @NotNull(message = "Материал обязателен")
            UUID materialId,

            @NotNull(message = "Количество обязательно")
            @DecimalMin(value = "0.001", message = "Количество должно быть больше нуля")
            BigDecimal quantity,

            @Size(max = 50, message = "Единица измерения не должна превышать 50 символов")
            String unitOfMeasure,

            String notes
    ) {
    }
}
