package com.privod.platform.modules.russianDoc.web.dto;

import com.privod.platform.modules.kep.domain.KepCertificate;
import com.privod.platform.modules.kep.domain.KepCertificateStatus;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record KepCertificateResponse(
        UUID id,
        String ownerName,
        String serialNumber,
        String issuer,
        LocalDateTime validFrom,
        LocalDateTime validTo,
        String thumbprint,
        KepCertificateStatus status,
        String statusDisplayName,
        boolean active,
        UUID ownerId,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static KepCertificateResponse fromEntity(KepCertificate entity) {
        return new KepCertificateResponse(
                entity.getId(),
                entity.getOwnerName(),
                entity.getSerialNumber(),
                entity.getIssuer(),
                entity.getValidFrom(),
                entity.getValidTo(),
                entity.getThumbprint(),
                entity.getStatus(),
                entity.getStatus() != null ? entity.getStatus().getDisplayName() : null,
                entity.isActive(),
                entity.getOwnerId(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
