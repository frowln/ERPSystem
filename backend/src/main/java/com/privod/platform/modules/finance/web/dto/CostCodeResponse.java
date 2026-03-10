package com.privod.platform.modules.finance.web.dto;

import com.privod.platform.modules.finance.domain.CostCode;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CostCodeResponse(
        UUID id,
        String code,
        String name,
        String description,
        UUID parentId,
        Integer level,
        String standard,
        Boolean isActive,
        List<CostCodeResponse> children,
        Instant createdAt
) {
    public static CostCodeResponse fromEntity(CostCode entity) {
        return new CostCodeResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.getParentId(),
                entity.getLevel(),
                entity.getStandard(),
                entity.getIsActive(),
                null,
                entity.getCreatedAt()
        );
    }

    public static CostCodeResponse fromEntityWithChildren(CostCode entity, List<CostCodeResponse> children) {
        return new CostCodeResponse(
                entity.getId(),
                entity.getCode(),
                entity.getName(),
                entity.getDescription(),
                entity.getParentId(),
                entity.getLevel(),
                entity.getStandard(),
                entity.getIsActive(),
                children,
                entity.getCreatedAt()
        );
    }
}
