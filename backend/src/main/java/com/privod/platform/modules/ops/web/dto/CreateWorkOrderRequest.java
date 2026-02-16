package com.privod.platform.modules.ops.web.dto;

import com.privod.platform.modules.ops.domain.WorkOrderPriority;
import com.privod.platform.modules.ops.domain.WorkType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateWorkOrderRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotBlank(message = "Название обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        @NotNull(message = "Тип работ обязателен")
        WorkType workType,

        @Size(max = 500, message = "Местоположение не должно превышать 500 символов")
        String location,

        UUID assignedCrewId,
        UUID foremanId,
        LocalDate plannedStart,
        LocalDate plannedEnd,
        WorkOrderPriority priority
) {
}
