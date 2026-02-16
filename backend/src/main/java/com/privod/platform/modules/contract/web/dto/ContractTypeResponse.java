package com.privod.platform.modules.contract.web.dto;

import com.privod.platform.modules.contract.domain.ContractType;

import java.util.UUID;

public record ContractTypeResponse(
        UUID id,
        String code,
        String name,
        String description,
        Integer sequence,
        boolean active,
        boolean requiresLawyerApproval,
        boolean requiresManagementApproval,
        boolean requiresFinanceApproval
) {
    public static ContractTypeResponse fromEntity(ContractType type) {
        return new ContractTypeResponse(
                type.getId(),
                type.getCode(),
                type.getName(),
                type.getDescription(),
                type.getSequence(),
                type.isActive(),
                type.isRequiresLawyerApproval(),
                type.isRequiresManagementApproval(),
                type.isRequiresFinanceApproval()
        );
    }
}
