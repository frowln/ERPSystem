package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.ComplianceStatus;
import com.privod.platform.modules.quality.domain.SupervisionEntry;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record SupervisionEntryResponse(
        UUID id,
        String number,
        LocalDate date,
        String inspectorName,
        String workType,
        String remarks,
        String directives,
        ComplianceStatus complianceStatus,
        String complianceStatusDisplayName,
        UUID projectId,
        String projectName,
        Instant createdAt,
        Instant updatedAt
) {
    public static SupervisionEntryResponse fromEntity(SupervisionEntry entity) {
        return fromEntity(entity, null);
    }

    public static SupervisionEntryResponse fromEntity(SupervisionEntry entity, String projectName) {
        return new SupervisionEntryResponse(
                entity.getId(),
                entity.getNumber(),
                entity.getEntryDate(),
                entity.getInspectorName(),
                entity.getWorkType(),
                entity.getRemarks(),
                entity.getDirectives(),
                entity.getComplianceStatus(),
                entity.getComplianceStatus().getDisplayName(),
                entity.getProjectId(),
                projectName,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
