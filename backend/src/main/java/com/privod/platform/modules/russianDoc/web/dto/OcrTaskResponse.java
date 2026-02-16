package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.OcrTask;
import com.privod.platform.modules.russianDoc.domain.OcrTaskStatus;

import java.time.Instant;
import java.util.UUID;

public record OcrTaskResponse(
        UUID id,
        String fileUrl,
        String fileName,
        OcrTaskStatus status,
        String statusDisplayName,
        String recognizedText,
        String recognizedFields,
        Double confidence,
        Instant processedAt,
        UUID organizationId,
        UUID projectId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static OcrTaskResponse fromEntity(OcrTask entity) {
        return new OcrTaskResponse(
                entity.getId(),
                entity.getFileUrl(),
                entity.getFileName(),
                entity.getStatus(),
                entity.getStatus() != null ? entity.getStatus().getDisplayName() : null,
                entity.getRecognizedText(),
                entity.getRecognizedFields(),
                entity.getConfidence(),
                entity.getProcessedAt(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
