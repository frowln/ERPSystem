package com.privod.platform.modules.ai.web.dto;

import com.privod.platform.modules.ai.domain.AiDocumentAnalysis;
import com.privod.platform.modules.ai.domain.AnalysisStatus;
import com.privod.platform.modules.ai.domain.AnalysisType;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AiDocumentAnalysisResponse(
        UUID id,
        UUID documentId,
        AnalysisType analysisType,
        String analysisTypeDisplayName,
        Map<String, Object> result,
        Double confidence,
        Instant processedAt,
        AnalysisStatus status,
        String statusDisplayName,
        Instant createdAt
) {
    public static AiDocumentAnalysisResponse fromEntity(AiDocumentAnalysis entity) {
        return new AiDocumentAnalysisResponse(
                entity.getId(),
                entity.getDocumentId(),
                entity.getAnalysisType(),
                entity.getAnalysisType().getDisplayName(),
                entity.getResult(),
                entity.getConfidence(),
                entity.getProcessedAt(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getCreatedAt()
        );
    }
}
