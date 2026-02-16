package com.privod.platform.modules.journal.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateJournalRequest(
        UUID projectId,

        @NotBlank(message = "Название журнала обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        LocalDate startDate,

        LocalDate endDate,

        UUID responsibleId,

        String notes
) {
}
