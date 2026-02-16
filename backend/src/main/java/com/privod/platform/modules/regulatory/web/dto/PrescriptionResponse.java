package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.Prescription;
import com.privod.platform.modules.regulatory.domain.PrescriptionStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PrescriptionResponse(
        UUID id,
        UUID inspectionId,
        String number,
        String description,
        LocalDate deadline,
        PrescriptionStatus status,
        String statusDisplayName,
        Instant completedAt,
        String evidenceUrl,
        UUID responsibleId,
        Instant createdAt,
        Instant updatedAt
) {
    public static PrescriptionResponse fromEntity(Prescription prescription) {
        return new PrescriptionResponse(
                prescription.getId(),
                prescription.getInspectionId(),
                prescription.getNumber(),
                prescription.getDescription(),
                prescription.getDeadline(),
                prescription.getStatus(),
                prescription.getStatus().getDisplayName(),
                prescription.getCompletedAt(),
                prescription.getEvidenceUrl(),
                prescription.getResponsibleId(),
                prescription.getCreatedAt(),
                prescription.getUpdatedAt()
        );
    }
}
