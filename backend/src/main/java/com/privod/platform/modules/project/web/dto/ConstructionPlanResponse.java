package com.privod.platform.modules.project.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ConstructionPlanResponse(
        UUID id,
        UUID projectId,
        String planType,
        String status,
        int version,
        String author,
        String approvedBy,
        LocalDate approvedDate,
        UUID documentId,
        String notes
) {
}
