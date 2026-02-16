package com.privod.platform.modules.pto.web.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateKs11AcceptanceActRequest(
        @NotNull(message = "ID проекта обязателен")
        UUID projectId,

        @NotNull(message = "Дата обязательна")
        LocalDate date,

        String commissionMembers,

        String decision,

        String defects,

        String notes
) {
}
