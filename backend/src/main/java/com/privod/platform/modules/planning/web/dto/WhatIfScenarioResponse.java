package com.privod.platform.modules.planning.web.dto;

import java.util.List;
import java.util.UUID;

public record WhatIfScenarioResponse(
        UUID scenarioId,
        List<ConflictItem> conflicts,
        int coverageScore,
        List<String> recommendations
) {
    public record ConflictItem(
            UUID employeeId,
            String employeeName,
            String description,
            int totalAllocationPct
    ) {
    }
}
