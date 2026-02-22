package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.RegulatoryBodyType;
import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CreatePrescriptionRequest(
        UUID inspectionId,
        UUID projectId,

        @NotBlank(message = "Описание предписания обязательно")
        String description,

        RegulatoryBodyType regulatoryBodyType,
        LocalDate receivedDate,
        LocalDate deadline,
        LocalDate appealDeadline,
        UUID responsibleId,
        String responsibleName,
        BigDecimal fineAmount,
        Integer violationCount,
        String regulatoryReference,
        String notes
) {
}
