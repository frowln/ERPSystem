package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.InspectionType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateInspectionRequest(
        @NotNull(message = "Дата проверки обязательна")
        LocalDate inspectionDate,

        UUID projectId,
        UUID inspectorId,
        String inspectorName,

        @NotNull(message = "Тип проверки обязателен")
        InspectionType inspectionType,

        String notes
) {
}
