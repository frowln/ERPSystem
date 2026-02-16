package com.privod.platform.modules.closeout.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateCommissioningChecklistRequest(
        UUID projectId,

        @NotBlank(message = "Название чек-листа обязательно")
        @Size(max = 500, message = "Название не должно превышать 500 символов")
        String name,

        @Size(max = 100)
        String system,

        String checkItems,

        UUID inspectorId,

        LocalDate inspectionDate,

        String notes,

        String attachmentIds
) {
}
