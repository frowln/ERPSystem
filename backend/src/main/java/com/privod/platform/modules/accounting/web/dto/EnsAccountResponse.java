package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.EnsAccount;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record EnsAccountResponse(
        UUID id,
        UUID organizationId,
        String inn,
        String accountNumber,
        BigDecimal balance,
        Instant lastUpdated,
        boolean isActive,
        Instant lastSyncAt,
        Instant createdAt
) {
    public static EnsAccountResponse fromEntity(EnsAccount entity) {
        return new EnsAccountResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getInn(),
                entity.getAccountNumber(),
                entity.getBalance(),
                entity.getLastUpdated(),
                entity.isActive(),
                entity.getLastSyncAt(),
                entity.getCreatedAt()
        );
    }
}
