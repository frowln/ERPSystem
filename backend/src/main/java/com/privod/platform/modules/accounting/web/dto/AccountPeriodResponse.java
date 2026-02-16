package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.AccountPeriod;
import com.privod.platform.modules.accounting.domain.PeriodStatus;

import java.time.Instant;
import java.util.UUID;

public record AccountPeriodResponse(
        UUID id,
        Integer year,
        Integer month,
        PeriodStatus status,
        String statusDisplayName,
        UUID closedById,
        Instant closedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static AccountPeriodResponse fromEntity(AccountPeriod period) {
        return new AccountPeriodResponse(
                period.getId(),
                period.getYear(),
                period.getMonth(),
                period.getStatus(),
                period.getStatus().getDisplayName(),
                period.getClosedById(),
                period.getClosedAt(),
                period.getCreatedAt(),
                period.getUpdatedAt()
        );
    }
}
