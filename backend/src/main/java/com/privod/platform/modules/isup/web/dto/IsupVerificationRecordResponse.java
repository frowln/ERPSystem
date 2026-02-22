package com.privod.platform.modules.isup.web.dto;

import com.privod.platform.modules.isup.domain.IsupVerificationRecord;
import com.privod.platform.modules.isup.domain.IsupVerificationType;

import java.time.Instant;
import java.util.UUID;

public record IsupVerificationRecordResponse(
        UUID id,
        UUID organizationId,
        UUID transmissionId,
        IsupVerificationType verificationType,
        String verificationTypeDisplayName,
        String verifiedByName,
        Instant verifiedAt,
        String comments,
        String externalReference,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static IsupVerificationRecordResponse fromEntity(IsupVerificationRecord entity) {
        return new IsupVerificationRecordResponse(
                entity.getId(),
                entity.getOrganizationId(),
                entity.getTransmissionId(),
                entity.getVerificationType(),
                entity.getVerificationType().getDisplayName(),
                entity.getVerifiedByName(),
                entity.getVerifiedAt(),
                entity.getComments(),
                entity.getExternalReference(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
