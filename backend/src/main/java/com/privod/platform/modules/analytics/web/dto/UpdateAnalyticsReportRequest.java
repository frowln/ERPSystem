package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.BiOutputFormat;
import com.privod.platform.modules.analytics.domain.BiReportType;

public record UpdateAnalyticsReportRequest(
        String name,
        BiReportType reportType,
        String category,
        String query,
        String parameters,
        BiOutputFormat outputFormat,
        Boolean isPublic,
        String description
) {
}
