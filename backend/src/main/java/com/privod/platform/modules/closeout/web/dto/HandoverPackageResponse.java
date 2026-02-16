package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.HandoverPackage;
import com.privod.platform.modules.closeout.domain.HandoverStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record HandoverPackageResponse(
        UUID id,
        UUID projectId,
        String packageNumber,
        String title,
        String description,
        HandoverStatus status,
        String statusDisplayName,
        String recipientOrganization,
        UUID recipientContactId,
        UUID preparedById,
        LocalDate preparedDate,
        LocalDate handoverDate,
        LocalDate acceptedDate,
        UUID acceptedById,
        String documentIds,
        String drawingIds,
        String certificateIds,
        String manualIds,
        String rejectionReason,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static HandoverPackageResponse fromEntity(HandoverPackage entity) {
        return new HandoverPackageResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getPackageNumber(),
                entity.getTitle(),
                entity.getDescription(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getRecipientOrganization(),
                entity.getRecipientContactId(),
                entity.getPreparedById(),
                entity.getPreparedDate(),
                entity.getHandoverDate(),
                entity.getAcceptedDate(),
                entity.getAcceptedById(),
                entity.getDocumentIds(),
                entity.getDrawingIds(),
                entity.getCertificateIds(),
                entity.getManualIds(),
                entity.getRejectionReason(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
