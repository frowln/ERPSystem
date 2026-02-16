package com.privod.platform.modules.revenueRecognition.web.dto;

import com.privod.platform.modules.revenueRecognition.domain.RecognitionMethod;
import com.privod.platform.modules.revenueRecognition.domain.RecognitionStandard;
import com.privod.platform.modules.revenueRecognition.domain.RevenueContract;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RevenueContractResponse(
        UUID id,
        UUID projectId,
        UUID contractId,
        String contractName,
        RecognitionMethod recognitionMethod,
        String recognitionMethodDisplayName,
        RecognitionStandard recognitionStandard,
        String recognitionStandardDisplayName,
        BigDecimal totalContractRevenue,
        BigDecimal totalEstimatedCost,
        UUID organizationId,
        LocalDate startDate,
        LocalDate endDate,
        Boolean isActive,
        boolean lossContract,
        BigDecimal expectedProfit,
        BigDecimal expectedLoss,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static RevenueContractResponse fromEntity(RevenueContract entity) {
        return new RevenueContractResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getContractId(),
                entity.getContractName(),
                entity.getRecognitionMethod(),
                entity.getRecognitionMethod().getDisplayName(),
                entity.getRecognitionStandard(),
                entity.getRecognitionStandard().getDisplayName(),
                entity.getTotalContractRevenue(),
                entity.getTotalEstimatedCost(),
                entity.getOrganizationId(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getIsActive(),
                entity.isLossContract(),
                entity.getExpectedProfit(),
                entity.getExpectedLoss(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
