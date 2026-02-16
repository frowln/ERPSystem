package com.privod.platform.modules.punchlist.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.UUID;

public record CreatePunchListRequest(
        UUID projectId,

        @NotBlank(message = "Название списка замечаний обязательно")
        String name,

        UUID createdById,
        LocalDate dueDate,
        String areaOrZone
) {
}
