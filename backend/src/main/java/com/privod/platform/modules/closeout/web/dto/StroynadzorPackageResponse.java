package com.privod.platform.modules.closeout.web.dto;

import com.privod.platform.modules.closeout.domain.StroynadzorPackage;
import com.privod.platform.modules.closeout.domain.StroynadzorPackageStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record StroynadzorPackageResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        UUID wbsNodeId,
        String name,
        StroynadzorPackageStatus status,
        String statusDisplayName,
        BigDecimal completenessPct,
        int totalDocuments,
        int missingDocuments,
        Long fileSizeBytes,
        Instant generatedAt,
        Instant sentAt,
        String sentTo,
        String errorMessage,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static StroynadzorPackageResponse fromEntity(StroynadzorPackage entity) {
        return new StroynadzorPackageResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getWbsNodeId(),
                entity.getName(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCompletenessPct(),
                entity.getTotalDocuments(),
                entity.getMissingDocuments(),
                entity.getFileSizeBytes(),
                entity.getGeneratedAt(),
                entity.getSentAt(),
                entity.getSentTo(),
                entity.getErrorMessage(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
