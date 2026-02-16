package com.privod.platform.modules.pto.web.dto;

import com.privod.platform.modules.quality.domain.MaterialCertificate;
import com.privod.platform.modules.quality.domain.MaterialCertificateStatus;
import com.privod.platform.modules.quality.domain.MaterialCertificateType;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

public record MaterialCertificateResponse(
        UUID id,
        UUID materialId,
        String materialName,
        String certificateNumber,
        MaterialCertificateType certificateType,
        String certificateTypeDisplayName,
        String issuedBy,
        LocalDate issuedDate,
        LocalDate expiryDate,
        String fileUrl,
        MaterialCertificateStatus status,
        String statusDisplayName,
        UUID verifiedById,
        LocalDateTime verifiedAt,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static MaterialCertificateResponse fromEntity(MaterialCertificate entity) {
        return new MaterialCertificateResponse(
                entity.getId(),
                entity.getMaterialId(),
                entity.getMaterialName(),
                entity.getCertificateNumber(),
                entity.getCertificateType(),
                entity.getCertificateType().getDisplayName(),
                entity.getIssuedBy(),
                entity.getIssuedDate(),
                entity.getExpiryDate(),
                entity.getFileUrl(),
                entity.getStatus(),
                entity.getStatus().getDisplayName(),
                entity.getVerifiedById(),
                entity.getVerifiedAt(),
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
