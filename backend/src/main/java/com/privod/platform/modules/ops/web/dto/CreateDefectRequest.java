package com.privod.platform.modules.ops.web.dto;

import com.privod.platform.modules.ops.domain.DefectSeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateDefectRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        UUID qualityCheckId,

        @NotBlank(message = "Название обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        @Size(max = 500, message = "Местоположение не должно превышать 500 символов")
        String location,

        DefectSeverity severity,
        String photoUrls,
        UUID detectedById,
        UUID assignedToId,
        UUID contractorId,
        LocalDate fixDeadline,
        Integer slaDeadlineHours,
        UUID drawingId,
        Double pinX,
        Double pinY
) {
}
