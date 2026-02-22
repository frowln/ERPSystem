package com.privod.platform.modules.closeout.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateWarrantyObligationRequest(
        @NotNull UUID projectId,
        UUID handoverPackageId,
        @NotBlank @Size(max = 500) String title,
        String description,
        String system,
        @NotNull LocalDate warrantyStartDate,
        @NotNull LocalDate warrantyEndDate,
        String contractorName,
        String contractorContactInfo,
        String coverageTerms,
        String exclusions,
        String notes
) {
}
