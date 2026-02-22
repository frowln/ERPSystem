package com.privod.platform.modules.hr.web.dto;

import com.privod.platform.modules.hr.domain.CertificateType;
import com.privod.platform.modules.hr.domain.EmployeeCertificate;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record CertificateResponse(
        UUID id,
        UUID employeeId,
        CertificateType certificateType,
        String certificateTypeDisplayName,
        String name,
        String number,
        LocalDate issuedDate,
        LocalDate expiryDate,
        String issuedBy,
        boolean expired,
        String notes,
        Instant createdAt,
        Instant updatedAt
) {
    public static CertificateResponse fromEntity(EmployeeCertificate cert) {
        return new CertificateResponse(
                cert.getId(),
                cert.getEmployeeId(),
                cert.getCertificateType(),
                cert.getCertificateType().getDisplayName(),
                cert.getName(),
                cert.getNumber(),
                cert.getIssuedDate(),
                cert.getExpiryDate(),
                cert.getIssuedBy(),
                cert.isExpired(),
                cert.getNotes(),
                cert.getCreatedAt(),
                cert.getUpdatedAt()
        );
    }

    public static CertificateResponse fromEntity(EmployeeCertificate cert, String employeeName) {
        // employeeName is available for context but not included in record fields
        return fromEntity(cert);
    }
}
