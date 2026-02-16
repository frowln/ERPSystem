package com.privod.platform.modules.task.web.dto;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateMilestoneRequest(
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        UUID projectId,

        LocalDate dueDate,

        String description,

        Integer progress
) {
}
