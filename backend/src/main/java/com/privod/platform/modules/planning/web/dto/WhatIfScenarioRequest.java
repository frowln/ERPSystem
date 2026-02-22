package com.privod.platform.modules.planning.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record WhatIfScenarioRequest(
        @NotBlank String name,
        String description,
        @NotEmpty List<AllocationChange> changes
) {
    public record AllocationChange(
            UUID employeeId,
            UUID fromProjectId,
            UUID toProjectId,
            LocalDate startDate,
            LocalDate endDate,
            int allocationPercent
    ) {
    }
}
