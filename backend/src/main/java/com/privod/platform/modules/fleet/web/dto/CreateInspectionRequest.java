package com.privod.platform.modules.fleet.web.dto;

import com.privod.platform.modules.fleet.domain.InspectionRating;
import com.privod.platform.modules.fleet.domain.InspectionType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateInspectionRequest(
        @NotNull(message = "Идентификатор техники обязателен")
        UUID vehicleId,

        UUID inspectorId,

        @NotNull(message = "Дата осмотра обязательна")
        LocalDate inspectionDate,

        @NotNull(message = "Тип осмотра обязателен")
        InspectionType inspectionType,

        @NotNull(message = "Общая оценка обязательна")
        InspectionRating overallRating,

        String findings,
        String recommendations,
        LocalDate nextInspectionDate
) {
}
