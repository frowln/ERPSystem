package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.WarrantyClaim;
import com.privod.platform.modules.closeout.domain.WarrantyClaimStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record WarrantyClaimResponse(
        UUID id,
        UUID projectId,
        UUID handoverPackageId,
        String claimNumber,
        String title,
        String description,
        WarrantyClaimStatus status,
        String statusDisplayName,
        String defectType,
        String location,
        UUID reportedById,
        LocalDate reportedDate,
        LocalDate warrantyExpiryDate,
        UUID assignedToId,
        LocalDate resolvedDate,
        String resolutionDescription,
        BigDecimal costOfRepair,
        String attachmentIds,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static WarrantyClaimResponse fromEntity(WarrantyClaim entity) {
        return new WarrantyClaimResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getHandoverPackageId(),
                entity.getClaimNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getDefectType(),
                entity.getLocation(),
                entity.getReportedById(),
                entity.getReportedDate(),
                entity.getWarrantyExpiryDate(),
                entity.getAssignedToId(),
                entity.getResolvedDate(),
                entity.getResolutionDescription(),
                entity.getCostOfRepair(),
                entity.getAttachmentIds(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
