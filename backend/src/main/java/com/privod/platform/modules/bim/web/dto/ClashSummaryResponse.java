package com.privod.platform.modules.bim.web.dto;

import java.util.List;
import java.util.UUID;

public record ClashSummaryResponse(
        UUID projectId,
        List<TestSummary> tests
) {
    public record TestSummary(
            UUID clashTestId,
            String testName,
            long total,
            long activeCount,
            long newCount,
            long resolvedCount,
            long ignoredCount
    ) {
    }
}
