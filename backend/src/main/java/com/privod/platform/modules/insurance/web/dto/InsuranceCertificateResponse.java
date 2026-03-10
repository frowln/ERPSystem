package com.privod.platform.modules.insurance.web.dto;

import com.privod.platform.modules.insurance.domain.InsuranceCertificate;

import java.math.BigDecimal;
import java.util.UUID;

public record InsuranceCertificateResponse(
    UUID id,
    UUID vendorId,
    String vendorName,
    String certificateType,
    String policyNumber,
    String insurerName,
    BigDecimal coverageAmount,
    BigDecimal deductible,
    String effectiveDate,
    String expiryDate,
    String certificateHolder,
    String status,
    String storagePath,
    String notes,
    String createdAt,
    String updatedAt
) {
    public static InsuranceCertificateResponse fromEntity(InsuranceCertificate e) {
        return new InsuranceCertificateResponse(
            e.getId(),
            e.getVendorId(),
            e.getVendorName(),
            e.getCertificateType() != null ? e.getCertificateType().name() : null,
            e.getPolicyNumber(),
            e.getInsurerName(),
            e.getCoverageAmount(),
            e.getDeductible(),
            e.getEffectiveDate() != null ? e.getEffectiveDate().toString() : null,
            e.getExpiryDate() != null ? e.getExpiryDate().toString() : null,
            e.getCertificateHolder(),
            e.getStatus() != null ? e.getStatus().name() : "PENDING",
            e.getStoragePath(),
            e.getNotes(),
            e.getCreatedAt() != null ? e.getCreatedAt().toString() : null,
            e.getUpdatedAt() != null ? e.getUpdatedAt().toString() : null
        );
    }
}
