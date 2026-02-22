package com.privod.platform.modules.safety.web.dto;

import com.privod.platform.modules.safety.domain.BriefingType;
import com.privod.platform.modules.safety.domain.SafetyBriefingRule;

import java.time.Instant;
import java.util.UUID;

public record SafetyBriefingRuleResponse(
        UUID id,
        UUID organizationId,
        String rolePattern,
        String hazardType,
        BriefingType briefingType,
        String briefingTypeDisplayName,
        Integer frequencyDays,
        String requiredCertificateTypes,
        String description,
        Instant createdAt,
        Instant updatedAt
) {
    public static SafetyBriefingRuleResponse fromEntity(SafetyBriefingRule entity) {
        return new SafetyBriefingRuleResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getRolePattern(),
                entity.getHazardType(),
                entity.getBriefingType(),
                entity.getBriefingType().getDisplayName(),
                entity.getFrequencyDays(),
                entity.getRequiredCertificateTypes(),
                entity.getDescription(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
