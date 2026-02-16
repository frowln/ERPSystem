package com.privod.platform.modules.analytics.web.dto;

import java.util.UUID;

public record ExecuteReportRequest(
        UUID executedById,

        String parametersJson
) {
}
