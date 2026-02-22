package com.privod.platform.modules.ai.classification.web.dto;

public record ClassificationStatsResponse(
        long totalClassifications,
        long confirmedClassifications,
        long pendingOcrJobs,
        long processingOcrJobs,
        long failedCrossChecks,
        long passedCrossChecks
) {
}
