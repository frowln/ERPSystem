package com.privod.platform.modules.pto.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateHiddenWorkActRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата обязательна")
        LocalDate date,

        @NotBlank(message = "Описание работ обязательно")
        String workDescription,

        String location,

        UUID inspectorId,

        UUID contractorId,

        String photoIds,

        String notes
) {
}
