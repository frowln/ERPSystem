package com.privod.platform.modules.costManagement.web.dto;

import com.privod.platform.modules.costManagement.domain.CostCode;
import com.privod.platform.modules.costManagement.domain.CostCodeLevel;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record CostCodeResponse(
        UUID id,
        UUID projectId,
        String code,
        String name,
        String description,
        UUID parentId,
        CostCodeLevel level,
        String levelDisplayName,
        BigDecimal budgetAmount,
        Boolean isActive,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static CostCodeResponse fromEntity(CostCode entity) {
        return new CostCodeResponse(
                entity.getId(),
                entity.getProjectId(),
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.getParentId(),
                entity.getLevel(),
                entity.getLevel().getDisplayName(),
                entity.getBudgetAmount(),
                entity.getIsActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
