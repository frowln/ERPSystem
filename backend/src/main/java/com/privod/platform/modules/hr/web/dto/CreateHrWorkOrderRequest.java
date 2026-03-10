package com.privod.platform.modules.hr.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CreateHrWorkOrderRequest(
        @NotBlank String type,
        @NotNull UUID projectId,
        String crewName,
        String workDescription,
        @NotNull LocalDate date,
        LocalDate endDate,
        String safetyRequirements,
        String hazardousConditions,
        List<String> requiredPermits
) {}
