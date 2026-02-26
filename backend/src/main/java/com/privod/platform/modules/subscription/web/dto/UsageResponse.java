package com.privod.platform.modules.subscription.web.dto;

import java.util.List;

public record UsageResponse(
        String planName,
        String planDisplayName,
        List<QuotaResponse> quotas
) {
}
