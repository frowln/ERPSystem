package com.privod.platform.modules.project.web.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateMilestoneRequest(
        @NotBlank String name,
        LocalDate plannedDate,
        String status,
        Boolean isKeyMilestone,
        String notes,
        Integer sequence
) {
}
