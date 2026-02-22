package com.privod.platform.modules.closeout.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.privod.platform.modules.closeout.domain.StroynadzorPackage;
import com.privod.platform.modules.closeout.domain.StroynadzorPackageStatus;

public record StroynadzorPackageDetailResponse(
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
        String missingDocumentsJson,
        String tocJson,
        Long fileSizeBytes,
        Instant generatedAt,
        Instant sentAt,
        String sentTo,
        String errorMessage,
        String notes,
        List<StroynadzorPackageDocumentResponse> documents,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static StroynadzorPackageDetailResponse fromEntity(
            StroynadzorPackage entity,
            List<StroynadzorPackageDocumentResponse> documents) {
        return new StroynadzorPackageDetailResponse(
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
                entity.getMissingDocumentsJson(),
                entity.getTocJson(),
                entity.getFileSizeBytes(),
                entity.getGeneratedAt(),
                entity.getSentAt(),
                entity.getSentTo(),
                entity.getErrorMessage(),
                entity.getNotes(),
                documents,
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
