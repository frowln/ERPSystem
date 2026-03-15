package com.privod.platform.modules.apiManagement.web.dto;

import com.privod.platform.modules.apiManagement.domain.RetryPolicy;

public record UpdateWebhookConfigRequest(
        String name,
        String url,
        String secret,
        String events,
        Boolean isActive,
        RetryPolicy retryPolicy,
        String secondarySecret,
        String resourceFilter
) {
}
