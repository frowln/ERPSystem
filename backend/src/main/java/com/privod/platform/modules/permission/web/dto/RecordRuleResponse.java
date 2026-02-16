package com.privod.platform.modules.permission.web.dto;

import com.privod.platform.modules.permission.domain.RecordRule;

import java.time.Instant;
import java.util.UUID;

public record RecordRuleResponse(
        UUID id,
        String name,
        String modelName,
        UUID groupId,
        String domainFilter,
        boolean permRead,
        boolean permWrite,
        boolean permCreate,
        boolean permUnlink,
        boolean isGlobal,
        Instant createdAt,
        Instant updatedAt
) {
    public static RecordRuleResponse fromEntity(RecordRule rule) {
        return new RecordRuleResponse(
                rule.getId(),
                rule.getName(),
                rule.getModelName(),
                rule.getGroupId(),
                rule.getDomainFilter(),
                rule.isPermRead(),
                rule.isPermWrite(),
                rule.isPermCreate(),
                rule.isPermUnlink(),
                rule.isGlobal(),
                rule.getCreatedAt(),
                rule.getUpdatedAt()
        );
    }
}
