package com.privod.platform.modules.esg.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record GenerateEsgReportRequest(
        @NotNull UUID projectId,
        String period,
        BigDecimal carbonTarget,
        BigDecimal builtAreaSqm,
        String notes
) {}
