package com.privod.platform.modules.analytics.web.dto;

import java.time.LocalDate;
import java.util.UUID;

public record ProjectTimelineEntry(
        UUID projectId,
        String projectCode,
        String projectName,
        String status,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        LocalDate actualStartDate,
        LocalDate actualEndDate,
        double completionPercent
) {
}
