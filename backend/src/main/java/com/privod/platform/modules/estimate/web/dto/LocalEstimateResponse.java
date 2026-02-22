package com.privod.platform.modules.estimate.web.dto;

import com.privod.platform.modules.estimate.domain.CalculationMethod;
import com.privod.platform.modules.estimate.domain.LocalEstimate;
import com.privod.platform.modules.estimate.domain.LocalEstimateStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record LocalEstimateResponse(
        UUID id,
        UUID organizationId,
        UUID projectId,
        UUID contractId,
        String name,
        String number,
        String objectName,
        CalculationMethod calculationMethod,
        String region,
        Integer baseYear,
        String priceLevelQuarter,
        LocalEstimateStatus status,
        BigDecimal totalDirectCost,
        BigDecimal totalOverhead,
        BigDecimal totalEstimatedProfit,
        BigDecimal totalWithVat,
        BigDecimal vatRate,
        String notes,
        Instant calculatedAt,
        long lineCount,
        Instant createdAt,
        Instant updatedAt
) {
    public static LocalEstimateResponse fromEntity(LocalEstimate entity, long lineCount) {
        return new LocalEstimateResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectId(),
                entity.getContractId(),
                entity.getName(),
                entity.getNumber(),
                entity.getObjectName(),
                entity.getCalculationMethod(),
                entity.getRegion(),
                entity.getBaseYear(),
                entity.getPriceLevelQuarter(),
                entity.getStatus(),
                entity.getTotalDirectCost(),
                entity.getTotalOverhead(),
                entity.getTotalEstimatedProfit(),
                entity.getTotalWithVat(),
                entity.getVatRate(),
                entity.getNotes(),
                entity.getCalculatedAt(),
                lineCount,
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
