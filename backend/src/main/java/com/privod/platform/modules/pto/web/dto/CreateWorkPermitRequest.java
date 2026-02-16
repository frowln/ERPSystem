package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.WorkType;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

public record CreateWorkPermitRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Тип работ обязателен")
        WorkType workType,

        String location,

        @NotNull(message = "Дата начала обязательна")
        LocalDate startDate,

        @NotNull(message = "Дата окончания обязательна")
        LocalDate endDate,

        UUID issuedById,

        Map<String, Object> safetyMeasures,

        String notes
) {
}
