package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.pto.domain.ActResult;
import com.privod.platform.modules.pto.domain.WorkType;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreateActOsvidetelstvovanieRequest(
        @NotNull(message = "Идентификатор проекта обязателен")
        UUID projectId,

        @NotNull(message = "Тип работ обязателен")
        WorkType workType,

        BigDecimal volume,

        String unit,

        LocalDate startDate,

        LocalDate endDate,

        UUID responsibleId,

        UUID inspectorId,

        ActResult result,

        String comments
) {
}
