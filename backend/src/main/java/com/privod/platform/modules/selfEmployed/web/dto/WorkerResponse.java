package com.privod.platform.modules.selfEmployed.web.dto;

import com.privod.platform.modules.selfEmployed.domain.ContractType;
import com.privod.platform.modules.selfEmployed.domain.NpdStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedWorker;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;

public record WorkerResponse(
        UUID id,
        UUID organizationId,
        String fullName,
        String inn,
        String phone,
        String email,
        NpdStatus npdStatus,
        String npdStatusDisplayName,
        Instant npdVerifiedAt,
        ContractType contractType,
        String contractTypeDisplayName,
        String contractNumber,
        LocalDate contractStartDate,
        LocalDate contractEndDate,
        String specialization,
        BigDecimal hourlyRate,
        BigDecimal totalPaid,
        Set<UUID> projectIds,
        Instant createdAt,
        Instant updatedAt
) {
    public static WorkerResponse fromEntity(SelfEmployedWorker w) {
        return new WorkerResponse(
                w.getId(),
                w.getOrganizationId(),
                w.getFullName(),
                w.getInn(),
                w.getPhone(),
                w.getEmail(),
                w.getNpdStatus(),
                w.getNpdStatus().getDisplayName(),
                w.getNpdVerifiedAt(),
                w.getContractType(),
                w.getContractType().getDisplayName(),
                w.getContractNumber(),
                w.getContractStartDate(),
                w.getContractEndDate(),
                w.getSpecialization(),
                w.getHourlyRate(),
                w.getTotalPaid(),
                w.getProjectIds(),
                w.getCreatedAt(),
                w.getUpdatedAt()
        );
    }
}
