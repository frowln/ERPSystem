package com.privod.platform.modules.hr.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.UUID;

public record CreateQualificationRecordRequest(
        @NotNull UUID employeeId,
        @NotBlank String qualificationType,
        String certificateNumber,
        @NotNull LocalDate issueDate,
        @NotNull LocalDate expiryDate
) {}
