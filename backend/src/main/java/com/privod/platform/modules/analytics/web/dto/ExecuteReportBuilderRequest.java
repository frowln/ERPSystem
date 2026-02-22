package com.privod.platform.modules.analytics.web.dto;

import com.privod.platform.modules.analytics.domain.ReportOutputFormat;

public record ExecuteReportBuilderRequest(
        String parametersJson,

        ReportOutputFormat outputFormat
) {
}
