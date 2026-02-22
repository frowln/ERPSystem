package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.WarrantyObligation;

import java.time.Instant;
import java.util.UUID;

public record WarrantyObligationResponse(
        UUID id,
        UUID projectId,
        UUID handoverPackageId,
        String title,
        String description,
        String system,
        String warrantyStartDate,
        String warrantyEndDate,
        String contractorName,
        String contractorContactInfo,
        String coverageTerms,
        String exclusions,
        String status,
        String statusDisplayName,
        String notes,
        long daysRemaining,
        boolean isExpired,
        int claimCount,
        Instant createdAt
) {
    public static WarrantyObligationResponse fromEntity(WarrantyObligation entity, int claimCount) {
        return new WarrantyObligationResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getHandoverPackageId(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getSystem(),
                entity.getWarrantyStartDate() != null ? entity.getWarrantyStartDate().toString() : null,
                entity.getWarrantyEndDate() != null ? entity.getWarrantyEndDate().toString() : null,
                entity.getContractorName(),
                entity.getContractorContactInfo(),
                entity.getCoverageTerms(),
                entity.getExclusions(),
                entity.getStatus().name(),
                entity.getStatus().getDisplayName(),
                entity.getNotes(),
                entity.daysRemaining(),
                entity.isExpired(),
                claimCount,
                entity.getCreatedAt()
        );
    }
}
