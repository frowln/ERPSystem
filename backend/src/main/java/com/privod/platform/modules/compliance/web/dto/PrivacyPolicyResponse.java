package com.privod.platform.modules.compliance.web.dto;

import com.privod.platform.modules.compliance.domain.PrivacyPolicy;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record PrivacyPolicyResponse(
        UUID id,
        UUID organizationId,
        String title,
        String content,
        String versionNumber,
        LocalDate effectiveFrom,
        LocalDate effectiveTo,
        boolean isCurrent,
        UUID approvedBy,
        Instant approvedAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static PrivacyPolicyResponse fromEntity(PrivacyPolicy entity) {
        return new PrivacyPolicyResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getTitle(),
                entity.getContent(),
                entity.getVersionNumber(),
                entity.getEffectiveFrom(),
                entity.getEffectiveTo(),
                entity.isCurrent(),
                entity.getApprovedBy(),
                entity.getApprovedAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
