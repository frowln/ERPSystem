package com.privod.platform.modules.organization.web.dto;

import com.privod.platform.modules.organization.domain.EnrichmentLogStatus;
import com.privod.platform.modules.organization.domain.PartnerEnrichmentLog;

import java.time.Instant;
import java.util.UUID;

public record PartnerEnrichmentLogResponse(
        UUID id,
        UUID partnerId,
        String source,
        Instant requestedAt,
        EnrichmentLogStatus status,
        String statusDisplayName,
        String responseData,
        String errorMessage,
        Instant createdAt
) {
    public static PartnerEnrichmentLogResponse fromEntity(PartnerEnrichmentLog logEntry) {
        return new PartnerEnrichmentLogResponse(
                logEntry.getId(),
                logEntry.getPartnerId(),
                logEntry.getSource(),
                logEntry.getRequestedAt(),
                logEntry.getStatus(),
                logEntry.getStatus().getDisplayName(),
                logEntry.getResponseData(),
                logEntry.getErrorMessage(),
                logEntry.getCreatedAt()
        );
    }
}
