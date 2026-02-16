package com.privod.platform.modules.priceCoefficient.web.dto;

import com.privod.platform.modules.priceCoefficient.domain.CoefficientStatus;
import com.privod.platform.modules.priceCoefficient.domain.CoefficientType;
import com.privod.platform.modules.priceCoefficient.domain.PriceCoefficient;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PriceCoefficientResponse(
        UUID id,
        String name,
        String code,
        BigDecimal value,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        UUID contractId,
        UUID projectId,
        CoefficientType type,
        String typeDisplayName,
        CoefficientStatus status,
        String statusDisplayName,
        String description,
        boolean appliedToEstimateItems,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static PriceCoefficientResponse fromEntity(PriceCoefficient pc) {
        return new PriceCoefficientResponse(
                pc.getId(),
                pc.getName(),
                pc.getCode(),
                pc.getValue(),
                pc.getEffectiveFrom(),
                pc.getEffectiveTo(),
                pc.getContractId(),
                pc.getProjectId(),
                pc.getType(),
                pc.getType().getDisplayName(),
                pc.getStatus(),
                pc.getStatus().getDisplayName(),
                pc.getDescription(),
                pc.isAppliedToEstimateItems(),
                pc.getCreatedAt(),
                pc.getUpdatedAt(),
                pc.getCreatedBy()
        );
    }
}
