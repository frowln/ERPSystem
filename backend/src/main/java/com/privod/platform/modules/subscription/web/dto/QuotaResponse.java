package com.privod.platform.modules.subscription.web.dto;

public record QuotaResponse(
        String quotaType,
        long current,
        long max,
        boolean exceeded
) {
}
