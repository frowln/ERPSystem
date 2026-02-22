package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.WarrantyObligationStatus;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateWarrantyObligationRequest(
        UUID projectId,
        UUID handoverPackageId,
        @Size(max = 500) String title,
        String description,
        String system,
        LocalDate warrantyStartDate,
        LocalDate warrantyEndDate,
        String contractorName,
        String contractorContactInfo,
        String coverageTerms,
        String exclusions,
        WarrantyObligationStatus status,
        String notes
) {
}
