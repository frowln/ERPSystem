package com.privod.platform.modules.revenueRecognition.web.dto;

import com.privod.platform.modules.revenueRecognition.domain.RevenueAdjustment;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record RevenueAdjustmentResponse(
        UUID id,
        UUID recognitionPeriodId,
        String adjustmentType,
        BigDecimal amount,
        String reason,
        BigDecimal previousValue,
        BigDecimal newValue,
        UUID approvedById,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static RevenueAdjustmentResponse fromEntity(RevenueAdjustment entity) {
        return new RevenueAdjustmentResponse(
                entity.getId(),
                entity.getRecognitionPeriodId(),
                entity.getAdjustmentType(),
                entity.getAmount(),
                entity.getReason(),
                entity.getPreviousValue(),
                entity.getNewValue(),
                entity.getApprovedById(),
                entity.getApprovedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
