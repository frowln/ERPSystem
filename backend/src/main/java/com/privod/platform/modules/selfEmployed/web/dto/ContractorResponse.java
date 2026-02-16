package com.privod.platform.modules.selfEmployed.web.dto;

import com.privod.platform.modules.selfEmployed.domain.ContractorStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedContractor;
import com.privod.platform.modules.selfEmployed.domain.TaxStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record ContractorResponse(
        UUID id,
        String fullName,
        String inn,
        String phone,
        String email,
        String bankAccount,
        String bic,
        ContractorStatus status,
        String statusDisplayName,
        LocalDate registrationDate,
        TaxStatus taxStatus,
        String taxStatusDisplayName,
        String projectIds,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static ContractorResponse fromEntity(SelfEmployedContractor c) {
        return new ContractorResponse(
                c.getId(),
                c.getFullName(),
                c.getInn(),
                c.getPhone(),
                c.getEmail(),
                c.getBankAccount(),
                c.getBic(),
                c.getStatus(),
                c.getStatus().getDisplayName(),
                c.getRegistrationDate(),
                c.getTaxStatus(),
                c.getTaxStatus().getDisplayName(),
                c.getProjectIds(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                c.getCreatedBy()
        );
    }
}
