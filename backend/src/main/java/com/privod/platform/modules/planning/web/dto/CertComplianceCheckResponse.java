package com.privod.platform.modules.planning.web.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record CertComplianceCheckResponse(
        UUID employeeId,
        String employeeName,
        boolean compliant,
        List<CertIssue> issues
) {
    public record CertIssue(
            String skillName,
            String certNumber,
            LocalDate expiryDate,
            String status
    ) {
    }
}
