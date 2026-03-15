package com.privod.platform.modules.auth.web.dto;

import com.privod.platform.modules.compliance.domain.ConsentType;
import com.privod.platform.modules.compliance.domain.DataConsent;

import java.time.Instant;
import java.util.UUID;

public record ConsentResponse(
        UUID id,
        ConsentType consentType,
        Instant consentedAt,
        Instant revokedAt,
        boolean isActive,
        Instant createdAt
) {
    public static ConsentResponse fromEntity(DataConsent entity) {
        return new ConsentResponse(
                entity.getId(),
                entity.getConsentType(),
                entity.getConsentedAt(),
                entity.getRevokedAt(),
                entity.isActive(),
                entity.getCreatedAt()
        );
    }
}
