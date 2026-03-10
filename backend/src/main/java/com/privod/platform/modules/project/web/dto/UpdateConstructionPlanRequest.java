package com.privod.platform.modules.project.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateConstructionPlanRequest(
        String planType,
        String status,
        Integer version,
        String author,
        String approvedBy,
        LocalDate approvedDate,
        UUID documentId,
        String notes
) {
}
