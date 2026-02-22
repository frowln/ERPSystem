package com.privod.platform.modules.ai.classification.web.dto;

import com.privod.platform.modules.ai.classification.domain.DocumentClassType;
import com.privod.platform.modules.ai.classification.domain.DocumentClassification;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record DocumentClassificationResponse(
        UUID id,
        UUID documentId,
        DocumentClassType detectedType,
        String detectedTypeDisplayName,
        Integer confidencePercent,
        boolean confirmed,
        UUID confirmedByUserId,
        Instant confirmedAt,
        Map<String, Object> rawOcrText,
        Map<String, Object> extractedMetadataJson,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static DocumentClassificationResponse fromEntity(DocumentClassification entity) {
        return new DocumentClassificationResponse(
                entity.getId(),
                entity.getDocumentId(),
                entity.getDetectedType(),
                entity.getDetectedType().getDisplayName(),
                entity.getConfidencePercent(),
                entity.isConfirmed(),
                entity.getConfirmedByUserId(),
                entity.getConfirmedAt(),
                entity.getRawOcrText(),
                entity.getExtractedMetadataJson(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
