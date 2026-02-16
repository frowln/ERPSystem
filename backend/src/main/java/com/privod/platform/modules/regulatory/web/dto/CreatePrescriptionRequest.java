package com.privod.platform.modules.regulatory.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.UUID;

public record CreatePrescriptionRequest(
        UUID inspectionId,

        @NotBlank(message = "Описание предписания обязательно")
        String description,

        LocalDate deadline,
        UUID responsibleId
) {
}
