package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.RegulatoryBodyType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record UpdatePrescriptionRequest(
        String description,
        RegulatoryBodyType regulatoryBodyType,
        UUID projectId,
        LocalDate receivedDate,
        LocalDate deadline,
        LocalDate appealDeadline,
        UUID responsibleId,
        String responsibleName,
        BigDecimal fineAmount,
        BigDecimal correctiveActionCost,
        Integer violationCount,
        String regulatoryReference,
        String evidenceUrl,
        String responseLetterUrl,
        String notes
) {
}
