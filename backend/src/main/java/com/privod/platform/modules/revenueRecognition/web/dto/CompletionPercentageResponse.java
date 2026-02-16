package com.privod.platform.modules.revenueRecognition.web.dto;

import com.privod.platform.modules.revenueRecognition.domain.CompletionPercentage;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CompletionPercentageResponse(
        UUID id,
        UUID revenueContractId,
        LocalDate calculationDate,
        RecognitionMethod method,
        String methodDisplayName,
        BigDecimal cumulativeCostIncurred,
        BigDecimal totalEstimatedCost,
        BigDecimal percentComplete,
        BigDecimal physicalPercentComplete,
        String notes,
        UUID calculatedById,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static CompletionPercentageResponse fromEntity(CompletionPercentage entity) {
        return new CompletionPercentageResponse(
                entity.getId(),
                entity.getRevenueContractId(),
                entity.getCalculationDate(),
                entity.getMethod(),
                entity.getMethod() != null ? entity.getMethod().getDisplayName() : null,
                entity.getCumulativeCostIncurred(),
                entity.getTotalEstimatedCost(),
                entity.getPercentComplete(),
                entity.getPhysicalPercentComplete(),
                entity.getNotes(),
                entity.getCalculatedById(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
