package com.privod.platform.modules.cde.web.dto;

import com.privod.platform.modules.cde.domain.Transmittal;
import com.privod.platform.modules.cde.domain.TransmittalPurpose;
import com.privod.platform.modules.cde.domain.TransmittalStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TransmittalResponse(
        UUID id,
        UUID projectId,
        String transmittalNumber,
        String subject,
        TransmittalPurpose purpose,
        String purposeDisplayName,
        TransmittalStatus status,
        String statusDisplayName,
        UUID fromOrganizationId,
        UUID toOrganizationId,
        LocalDate issuedDate,
        LocalDate dueDate,
        LocalDate acknowledgedDate,
        String coverNote,
        UUID sentById,
        Instant createdAt,
        Instant updatedAt
) {
    public static TransmittalResponse fromEntity(Transmittal entity) {
        return new TransmittalResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getTransmittalNumber(),
                entity.getSubject(),
                entity.getPurpose(),
                entity.getPurpose() != null ? entity.getPurpose().getDisplayName() : null,
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getFromOrganizationId(),
                entity.getToOrganizationId(),
                entity.getIssuedDate(),
                entity.getDueDate(),
                entity.getAcknowledgedDate(),
                entity.getCoverNote(),
                entity.getSentById(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
