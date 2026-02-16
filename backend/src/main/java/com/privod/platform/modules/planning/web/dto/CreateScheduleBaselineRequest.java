package com.privod.platform.modules.planning.web.dto;

import com.privod.platform.modules.planning.domain.BaselineType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateScheduleBaselineRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Наименование базового плана обязательно")
        @Size(max = 500, message = "Наименование не должно превышать 500 символов")
        String name,

        BaselineType baselineType,

        @NotNull(message = "Дата базового плана обязательна")
        LocalDate baselineDate,

        String snapshotData,
        UUID createdById,
        String notes
) {
}
