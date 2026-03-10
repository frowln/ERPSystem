package com.privod.platform.modules.finance.web.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record VeItemResponse(
        UUID id,
        UUID projectId,
        String originalMaterialName,
        String originalMaterialCode,
        BigDecimal originalPrice,
        String analogMaterialName,
        String analogBrand,
        String analogManufacturer,
        BigDecimal analogPrice,
        BigDecimal quantity,
        BigDecimal savingsPerUnit,
        BigDecimal totalSavings,
        String qualityImpact,
        String reason,
        String status,
        String statusDisplayName,
        UUID requestedById,
        UUID approvedById,
        String reviewComment,
        UUID specItemId,
        Instant createdAt,
        Instant updatedAt
) {
}
