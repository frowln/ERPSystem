package com.privod.platform.modules.procurementExt.web.dto;

import com.privod.platform.modules.procurementExt.domain.SupplierRating;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record SupplierRatingResponse(
        UUID id,
        UUID supplierId,
        String periodId,
        BigDecimal qualityScore,
        BigDecimal deliveryScore,
        BigDecimal priceScore,
        BigDecimal overallScore,
        UUID evaluatedById,
        String comments,
        Instant createdAt,
        Instant updatedAt
) {
    public static SupplierRatingResponse fromEntity(SupplierRating sr) {
        return new SupplierRatingResponse(
                sr.getId(),
                sr.getSupplierId(),
                sr.getPeriodId(),
                sr.getQualityScore(),
                sr.getDeliveryScore(),
                sr.getPriceScore(),
                sr.getOverallScore(),
                sr.getEvaluatedById(),
                sr.getComments(),
                sr.getCreatedAt(),
                sr.getUpdatedAt()
        );
    }
}
