package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.ContractSla;
import com.privod.platform.modules.contractExt.domain.PenaltyType;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record ContractSlaResponse(
        UUID id,
        UUID contractId,
        String metric,
        BigDecimal targetValue,
        String unit,
        String measurementPeriod,
        BigDecimal penaltyAmount,
        PenaltyType penaltyType,
        String penaltyTypeDisplayName,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ContractSlaResponse fromEntity(ContractSla entity) {
        return new ContractSlaResponse(
                entity.getId(),
                entity.getContractId(),
                entity.getMetric(),
                entity.getTargetValue(),
                entity.getUnit(),
                entity.getMeasurementPeriod(),
                entity.getPenaltyAmount(),
                entity.getPenaltyType(),
                entity.getPenaltyType() != null ? entity.getPenaltyType().getDisplayName() : null,
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
