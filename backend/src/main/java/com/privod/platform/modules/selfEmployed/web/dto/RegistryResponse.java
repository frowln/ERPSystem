package com.privod.platform.modules.selfEmployed.web.dto;

import com.privod.platform.modules.selfEmployed.domain.RegistryStatus;
import com.privod.platform.modules.selfEmployed.domain.SelfEmployedRegistry;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RegistryResponse(
        UUID id,
        String name,
        UUID projectId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal totalAmount,
        int totalPayments,
        RegistryStatus status,
        String statusDisplayName,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static RegistryResponse fromEntity(SelfEmployedRegistry r) {
        return new RegistryResponse(
                r.getId(),
                r.getName(),
                r.getProjectId(),
                r.getPeriodStart(),
                r.getPeriodEnd(),
                r.getTotalAmount(),
                r.getTotalPayments(),
                r.getStatus(),
                r.getStatus().getDisplayName(),
                r.getCreatedAt(),
                r.getUpdatedAt(),
                r.getCreatedBy()
        );
    }
}
