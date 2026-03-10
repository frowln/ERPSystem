package com.privod.platform.modules.safety.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TrainingRecordResponse(
        UUID id,
        UUID employeeId,
        String employeeName,
        String trainingType,
        LocalDate completedDate,
        LocalDate expiryDate,
        String certificateNumber,
        boolean expired,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
}
