package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.MilestoneStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record UpdateMilestoneRequest(
        @Size(max = 500, message = "Название вехи не должно превышать 500 символов")
        String title,

        String description,

        LocalDate targetDate,

        LocalDate actualDate,

        MilestoneStatus status,

        Integer sortOrder,

        Boolean visibleToClient
) {
}
