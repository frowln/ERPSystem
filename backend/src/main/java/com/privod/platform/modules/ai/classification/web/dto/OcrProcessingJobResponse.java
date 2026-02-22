package com.privod.platform.modules.ai.classification.web.dto;

import com.privod.platform.modules.ai.classification.domain.OcrProcessingJob;
import com.privod.platform.modules.ai.classification.domain.OcrStatus;

import java.time.Instant;
import java.util.UUID;

public record OcrProcessingJobResponse(
        UUID id,
        UUID documentId,
        OcrStatus status,
        String statusDisplayName,
        Instant startedAt,
        Instant completedAt,
        String errorMessage,
        Integer pageCount,
        Long processingTimeMs,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static OcrProcessingJobResponse fromEntity(OcrProcessingJob entity) {
        return new OcrProcessingJobResponse(
                entity.getId(),
                entity.getDocumentId(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getStartedAt(),
                entity.getCompletedAt(),
                entity.getErrorMessage(),
                entity.getPageCount(),
                entity.getProcessingTimeMs(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
