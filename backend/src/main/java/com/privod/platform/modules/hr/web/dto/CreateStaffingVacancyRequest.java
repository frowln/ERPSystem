package com.privod.platform.modules.hr.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreateStaffingVacancyRequest(
        @NotBlank String department,
        @NotBlank String position,
        String grade,
        @NotNull BigDecimal salaryMin,
        @NotNull BigDecimal salaryMax
) {}
