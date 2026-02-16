package com.privod.platform.modules.contract.web.dto;

import com.privod.platform.modules.contract.domain.Contract;
import com.privod.platform.modules.contract.domain.ContractStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ContractListResponse(
        UUID id,
        String name,
        String number,
        UUID partnerId,
        String partnerName,
        UUID projectId,
        ContractStatus status,
        String statusDisplayName,
        BigDecimal amount,
        BigDecimal totalWithVat,
        LocalDate plannedStartDate,
        LocalDate plannedEndDate,
        UUID responsibleId,
        boolean expired
) {
    public static ContractListResponse fromEntity(Contract contract) {
        return new ContractListResponse(
                contract.getId(),
                contract.getName(),
                contract.getNumber(),
                contract.getPartnerId(),
                contract.getPartnerName(),
                contract.getProjectId(),
                contract.getStatus(),
                contract.getStatus().getDisplayName(),
                contract.getAmount(),
                contract.getTotalWithVat(),
                contract.getPlannedStartDate(),
                contract.getPlannedEndDate(),
                contract.getResponsibleId(),
                contract.isExpired()
        );
    }
}
