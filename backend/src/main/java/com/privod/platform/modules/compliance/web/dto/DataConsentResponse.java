package com.privod.platform.modules.compliance.web.dto;

import com.privod.platform.modules.compliance.domain.ConsentType;
import com.privod.platform.modules.compliance.domain.DataConsent;
import com.privod.platform.modules.compliance.domain.LegalBasis;

import java.time.Instant;
import java.util.UUID;

public record DataConsentResponse(
        UUID id,
        UUID organizationId,
        UUID userId,
        ConsentType consentType,
        Instant consentedAt,
        Instant revokedAt,
        String ipAddress,
        String userAgent,
        String consentVersion,
        LegalBasis legalBasis,
        String purpose,
        String dataCategories,
        Integer retentionDays,
        boolean isActive,
        Instant createdAt,
        Instant updatedAt
) {
    public static DataConsentResponse fromEntity(DataConsent entity) {
        return new DataConsentResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getUserId(),
                entity.getConsentType(),
                entity.getConsentedAt(),
                entity.getRevokedAt(),
                entity.getIpAddress(),
                entity.getUserAgent(),
                entity.getConsentVersion(),
                entity.getLegalBasis(),
                entity.getPurpose(),
                entity.getDataCategories(),
                entity.getRetentionDays(),
                entity.isActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
