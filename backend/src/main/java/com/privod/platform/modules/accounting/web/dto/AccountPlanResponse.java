package com.privod.platform.modules.accounting.web.dto;

import com.privod.platform.modules.accounting.domain.AccountPlan;
import com.privod.platform.modules.accounting.domain.AccountType;

import java.time.Instant;
import java.util.UUID;

public record AccountPlanResponse(
        UUID id,
        String code,
        String name,
        AccountType accountType,
        String accountTypeDisplayName,
        UUID parentId,
        boolean analytical,
        String description,
        Instant createdAt
) {
    public static AccountPlanResponse fromEntity(AccountPlan entity) {
        return new AccountPlanResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getAccountType(),
                entity.getAccountType().getDisplayName(),
                entity.getParentId(),
                entity.isAnalytical(),
                entity.getDescription(),
                entity.getCreatedAt()
        );
    }
}
