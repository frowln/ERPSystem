package com.privod.platform.modules.kep.web.dto;

import com.privod.platform.modules.kep.domain.KepCertificate;
import com.privod.platform.modules.kep.domain.KepCertificateStatus;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

public record KepCertificateResponse(
        UUID id,
        UUID ownerId,
        String ownerName,
        String serialNumber,
        String issuer,
        LocalDateTime validFrom,
        LocalDateTime validTo,
        String thumbprint,
        String subjectCn,
        String subjectOrg,
        String subjectInn,
        String subjectOgrn,
        KepCertificateStatus status,
        String statusDisplayName,
        boolean qualified,
        boolean expired,
        boolean activeAndValid,
        Instant createdAt,
        Instant updatedAt
) {
    public static KepCertificateResponse fromEntity(KepCertificate cert) {
        return new KepCertificateResponse(
                cert.getId(),
                cert.getOwnerId(),
                cert.getOwnerName(),
                cert.getSerialNumber(),
                cert.getIssuer(),
                cert.getValidFrom(),
                cert.getValidTo(),
                cert.getThumbprint(),
                cert.getSubjectCn(),
                cert.getSubjectOrg(),
                cert.getSubjectInn(),
                cert.getSubjectOgrn(),
                cert.getStatus(),
                cert.getStatus().getDisplayName(),
                cert.isQualified(),
                cert.isExpired(),
                cert.isActive(),
                cert.getCreatedAt(),
                cert.getUpdatedAt()
        );
    }
}
