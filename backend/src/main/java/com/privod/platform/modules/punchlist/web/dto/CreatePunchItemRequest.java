package com.privod.platform.modules.punchlist.web.dto;

import com.privod.platform.modules.punchlist.domain.PunchItemPriority;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.UUID;

public record CreatePunchItemRequest(
        @NotBlank(message = "Описание замечания обязательно")
        String description,

        String location,
        String category,
        PunchItemPriority priority,
        UUID assignedToId,
        String photoUrls,
        LocalDate fixDeadline
) {
}
