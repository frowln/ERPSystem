package com.privod.platform.modules.safety.web.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record PrescriptionTrackerResponse(
        List<PrescriptionItem> prescriptions
) {

    public record PrescriptionItem(
            UUID violationId,
            String description,
            String severity,
            LocalDate dueDate,
            String status,
            long daysRemaining,
            String assignedToName
    ) {
    }
}
