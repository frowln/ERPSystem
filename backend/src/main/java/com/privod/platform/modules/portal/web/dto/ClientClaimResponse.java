package com.privod.platform.modules.portal.web.dto;

import com.privod.platform.modules.portal.domain.ClientClaim;

import java.time.Instant;
import java.util.UUID;

public record ClientClaimResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        String claimNumber,
        String unitNumber,
        String category,
        String categoryDisplayName,
        String priority,
        String priorityDisplayName,
        String title,
        String description,
        String locationDescription,
        String photosJson,
        String status,
        String statusDisplayName,
        UUID assignedContractorId,
        String assignedContractorName,
        Instant assignedAt,
        UUID reportedByPortalUserId,
        String reportedByName,
        String reportedByPhone,
        String reportedByEmail,
        Instant slaDeadline,
        Boolean slaBreached,
        String resolution,
        Instant resolutionDate,
        Boolean resolutionAccepted,
        String resolutionFeedback,
        Integer resolutionRating,
        UUID warrantyObligationId,
        String internalNotes,
        Instant triagedAt,
        UUID triagedBy,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Public factory — safe for portal-facing endpoints.
     * internalNotes is never included; use ClientClaimDetailResponse for internal views.
     */
    public static ClientClaimResponse fromEntity(ClientClaim claim) {
        return new ClientClaimResponse(
                claim.getId(),
                claim.getOrganizationId(),
                claim.getProjectId(),
                claim.getClaimNumber(),
                claim.getUnitNumber(),
                claim.getCategory() != null ? claim.getCategory().name() : null,
                claim.getCategory() != null ? claim.getCategory().getDisplayName() : null,
                claim.getPriority() != null ? claim.getPriority().name() : null,
                claim.getPriority() != null ? claim.getPriority().getDisplayName() : null,
                claim.getTitle(),
                claim.getDescription(),
                claim.getLocationDescription(),
                claim.getPhotosJson(),
                claim.getStatus() != null ? claim.getStatus().name() : null,
                claim.getStatus() != null ? claim.getStatus().getDisplayName() : null,
                claim.getAssignedContractorId(),
                claim.getAssignedContractorName(),
                claim.getAssignedAt(),
                claim.getReportedByPortalUserId(),
                claim.getReportedByName(),
                claim.getReportedByPhone(),
                claim.getReportedByEmail(),
                claim.getSlaDeadline(),
                claim.getSlaBreached(),
                claim.getResolution(),
                claim.getResolutionDate(),
                claim.getResolutionAccepted(),
                claim.getResolutionFeedback(),
                claim.getResolutionRating(),
                claim.getWarrantyObligationId(),
                null, // internalNotes — never exposed in public response (152-ФЗ compliance)
                claim.getTriagedAt(),
                claim.getTriagedBy(),
                claim.getCreatedAt(),
                claim.getUpdatedAt()
        );
    }
}
