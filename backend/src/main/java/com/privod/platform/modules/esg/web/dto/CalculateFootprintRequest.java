package com.privod.platform.modules.esg.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record CalculateFootprintRequest(
        @NotNull UUID projectId,
        LocalDate periodFrom,
        LocalDate periodTo,
        BigDecimal builtAreaSqm
) {}
