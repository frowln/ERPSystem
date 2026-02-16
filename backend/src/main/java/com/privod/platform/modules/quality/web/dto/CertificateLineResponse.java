package com.privod.platform.modules.quality.web.dto;

import com.privod.platform.modules.quality.domain.CertificateLine;

import java.time.Instant;
import java.util.UUID;

public record CertificateLineResponse(
        UUID id,
        UUID certificateId,
        String parameterName,
        String standardValue,
        String actualValue,
        String unit,
        boolean isCompliant,
        String testMethod,
        Instant createdAt,
        Instant updatedAt
) {
    public static CertificateLineResponse fromEntity(CertificateLine entity) {
        return new CertificateLineResponse(
                entity.getId(),
                entity.getCertificateId(),
                entity.getParameterName(),
                entity.getStandardValue(),
                entity.getActualValue(),
                entity.getUnit(),
                entity.isCompliant(),
                entity.getTestMethod(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
}
