package com.privod.platform.modules.pto.web.dto;

public record PtoDashboardResponse(
        long totalDocuments,
        long totalWorkPermits,
        long activeWorkPermits,
        long totalSubmittals,
        long pendingSubmittals,
        long totalLabTests,
        long failedLabTests,
        long totalCertificates,
        long expiredCertificates,
        long totalActsOsvidetelstvovanie,
        long totalQualityPlans
) {
}
