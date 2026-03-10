package com.privod.platform.modules.project.web.dto;

import java.time.LocalDate;

public record UpdateMilestoneRequest(
        String name,
        LocalDate plannedDate,
        LocalDate actualDate,
        String status,
        Boolean isKeyMilestone,
        String notes,
        Integer sequence
) {
}
