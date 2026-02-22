package com.privod.platform.modules.safety.web.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CertificateComplianceResponse(
        UUID employeeId,
        String employeeName,
        boolean compliant,
        List<CertificateStatus> certificates
) {

    public record CertificateStatus(
            UUID certificateId,
            String type,
            String number,
            LocalDate expiryDate,
            String status,
            long daysUntilExpiry
    ) {
    }
}
