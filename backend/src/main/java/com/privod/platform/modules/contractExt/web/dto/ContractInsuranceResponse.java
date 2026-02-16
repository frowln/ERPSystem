package com.privod.platform.modules.contractExt.web.dto;

import com.privod.platform.modules.contractExt.domain.ContractInsurance;
import com.privod.platform.modules.contractExt.domain.InsuranceStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ContractInsuranceResponse(
        UUID id,
        UUID contractId,
        String policyNumber,
        String insuranceType,
        String insurer,
        BigDecimal coveredAmount,
        BigDecimal premiumAmount,
        LocalDate startDate,
        LocalDate endDate,
        InsuranceStatus status,
        String statusDisplayName,
        String policyUrl,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ContractInsuranceResponse fromEntity(ContractInsurance entity) {
        return new ContractInsuranceResponse(
                entity.getId(),
                entity.getContractId(),
                entity.getPolicyNumber(),
                entity.getInsuranceType(),
                entity.getInsurer(),
                entity.getCoveredAmount(),
                entity.getPremiumAmount(),
                entity.getStartDate(),
                entity.getEndDate(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getPolicyUrl(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
