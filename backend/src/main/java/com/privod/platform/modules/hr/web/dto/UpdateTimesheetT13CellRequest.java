package com.privod.platform.modules.hr.web.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record UpdateTimesheetT13CellRequest(
        @NotNull UUID employeeId,
        @NotNull Integer day,
        String code,
        BigDecimal dayHours,
        BigDecimal nightHours
) {}
