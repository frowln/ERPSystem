package com.privod.platform.modules.ops.web.dto;

import com.privod.platform.modules.ops.domain.DefectSeverity;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateDefectRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String title,

        @Size(max = 5000, message = "Описание не должно превышать 5000 символов")
        String description,

        @Size(max = 500, message = "Местоположение не должно превышать 500 символов")
        String location,

        DefectSeverity severity,
        String photoUrls,
        UUID assignedToId,
        UUID contractorId,
        LocalDate fixDeadline,
        Integer slaDeadlineHours,
        String fixDescription,
        UUID drawingId,
        Double pinX,
        Double pinY,
        Double planX,
        Double planY,
        String planId
) {
}
