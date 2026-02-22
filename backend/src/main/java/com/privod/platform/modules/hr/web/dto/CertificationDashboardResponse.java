package com.privod.platform.modules.hr.web.dto;

import java.util.List;
import java.util.Map;

public record CertificationDashboardResponse(
        long totalCertificates,
        long validCount,
        long expiringCount,
        long expiredCount,
        double compliancePercent,
        Map<String, TypeBreakdown> byType,
        List<CertificateResponse> expiringCertificates,
        List<CertificateResponse> expiredCertificates
) {
    public record TypeBreakdown(
            String displayName,
            long valid,
            long expiring,
            long expired,
            long total
    ) {}
}
