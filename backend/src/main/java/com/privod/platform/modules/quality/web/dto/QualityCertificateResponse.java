package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.CertificateType;
import com.privod.platform.modules.quality.domain.QualityCertificate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record QualityCertificateResponse(
        UUID id,
        UUID materialId,
        UUID supplierId,
        String supplierName,
        String certificateNumber,
        LocalDate issueDate,
        LocalDate expiryDate,
        CertificateType certificateType,
        String certificateTypeDisplayName,
        String fileUrl,
        boolean isVerified,
        UUID verifiedById,
        Instant createdAt,
        Instant updatedAt,
        String createdBy
) {
    public static QualityCertificateResponse fromEntity(QualityCertificate entity) {
        return new QualityCertificateResponse(
                entity.getId(),
                entity.getMaterialId(),
                entity.getSupplierId(),
                entity.getSupplierName(),
                entity.getCertificateNumber(),
                entity.getIssueDate(),
                entity.getExpiryDate(),
                entity.getCertificateType(),
                entity.getCertificateType().getDisplayName(),
                entity.getFileUrl(),
                entity.isVerified(),
                entity.getVerifiedById(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getCreatedBy()
        );
    }
}
