package com.privod.platform.modules.regulatory.web.dto;

import com.privod.platform.modules.regulatory.domain.Prescription;
import com.privod.platform.modules.regulatory.domain.PrescriptionStatus;
import com.privod.platform.modules.regulatory.domain.RegulatoryBodyType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PrescriptionResponse(
        UUID id,
        UUID inspectionId,
        UUID projectId,
        String projectName,
        String number,
        String description,
        RegulatoryBodyType regulatoryBodyType,
        LocalDate receivedDate,
        LocalDate deadline,
        LocalDate appealDeadline,
        PrescriptionStatus status,
        String statusDisplayName,
        Instant completedAt,
        Instant responseSubmittedAt,
        LocalDate responseDate,
        String evidenceUrl,
        String responseLetterUrl,
        UUID responsibleId,
        String responsibleName,
        BigDecimal fineAmount,
        BigDecimal correctiveActionCost,
        Integer violationCount,
        String regulatoryReference,
        String notes,
        boolean appealFiled,
        LocalDate appealDate,
        Instant createdAt,
        Instant updatedAt
) {
    public static PrescriptionResponse fromEntity(Prescription p) {
        return fromEntity(p, null);
    }

    public static PrescriptionResponse fromEntity(Prescription p, String projectName) {
        return new PrescriptionResponse(
                p.getId(),
                p.getInspectionId(),
                p.getProjectId(),
                projectName,
                p.getNumber(),
                p.getDescription(),
                p.getRegulatoryBodyType(),
                p.getReceivedDate(),
                p.getDeadline(),
                p.getAppealDeadline(),
                p.getStatus(),
                p.getStatus().getDisplayName(),
                p.getCompletedAt(),
                p.getResponseSubmittedAt(),
                p.getResponseDate(),
                p.getEvidenceUrl(),
                p.getResponseLetterUrl(),
                p.getResponsibleId(),
                p.getResponsibleName(),
                p.getFineAmount(),
                p.getCorrectiveActionCost(),
                p.getViolationCount(),
                p.getRegulatoryReference(),
                p.getNotes(),
                p.isAppealFiled(),
                p.getAppealDate(),
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }
}
