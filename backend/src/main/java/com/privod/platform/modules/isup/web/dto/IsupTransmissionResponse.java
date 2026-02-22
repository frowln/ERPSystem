package com.privod.platform.modules.isup.web.dto;

import com.privod.platform.modules.isup.domain.IsupTransmission;
import com.privod.platform.modules.isup.domain.IsupTransmissionStatus;
import com.privod.platform.modules.isup.domain.IsupTransmissionType;

import java.time.Instant;
import java.util.UUID;

public record IsupTransmissionResponse(
        UUID id,
        UUID organizationId,
        UUID projectMappingId,
        IsupTransmissionType transmissionType,
        String transmissionTypeDisplayName,
        String payloadJson,
        IsupTransmissionStatus status,
        String statusDisplayName,
        Instant sentAt,
        Instant confirmedAt,
        String errorMessage,
        int retryCount,
        String externalId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static IsupTransmissionResponse fromEntity(IsupTransmission entity) {
        return new IsupTransmissionResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getProjectMappingId(),
                entity.getTransmissionType(),
                entity.getTransmissionType().getDisplayName(),
                entity.getPayloadJson(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getSentAt(),
                entity.getConfirmedAt(),
                entity.getErrorMessage(),
                entity.getRetryCount(),
                entity.getExternalId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
