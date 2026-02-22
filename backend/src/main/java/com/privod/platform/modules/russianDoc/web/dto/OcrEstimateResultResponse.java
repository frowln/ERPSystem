package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.russianDoc.domain.OcrEstimateResult;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record OcrEstimateResultResponse(
        UUID id,
        UUID ocrTaskId,
        Integer lineNumber,
        String rateCode,
        String name,
        String unit,
        BigDecimal quantity,
        BigDecimal unitPrice,
        BigDecimal totalPrice,
        BigDecimal confidence,
        String boundingBoxJson,
        boolean accepted,
        UUID matchedRateId,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static OcrEstimateResultResponse fromEntity(OcrEstimateResult entity) {
        return new OcrEstimateResultResponse(
                entity.getId(),
                entity.getOcrTaskId(),
                entity.getLineNumber(),
                entity.getRateCode(),
                entity.getName(),
                entity.getUnit(),
                entity.getQuantity(),
                entity.getUnitPrice(),
                entity.getTotalPrice(),
                entity.getConfidence(),
                entity.getBoundingBoxJson(),
                entity.isAccepted(),
                entity.getMatchedRateId(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
