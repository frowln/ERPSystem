package com.privod.platform.modules.integration.web.dto;

import com.privod.platform.modules.integration.domain.SbisPartnerMapping;

import java.time.Instant;
import java.util.UUID;

public record SbisPartnerMappingResponse(
        UUID id,
        UUID partnerId,
        String partnerName,
        String sbisContractorId,
        String sbisContractorInn,
        String sbisContractorKpp,
        boolean isActive,
        Instant lastSyncAt,
        Instant createdAt,
        Instant updatedAt
) {
    public static SbisPartnerMappingResponse fromEntity(SbisPartnerMapping entity) {
        return new SbisPartnerMappingResponse(
                entity.getId(),
                entity.getPartnerId(),
                entity.getPartnerName(),
                entity.getSbisContractorId(),
                entity.getSbisContractorInn(),
                entity.getSbisContractorKpp(),
                entity.isActive(),
                entity.getLastSyncAt(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
