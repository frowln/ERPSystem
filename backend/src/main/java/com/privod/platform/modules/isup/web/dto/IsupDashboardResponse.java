package com.privod.platform.modules.isup.web.dto;

import java.time.Instant;

public record IsupDashboardResponse(
        long totalMappings,
        long activeMappings,
        long pendingTransmissions,
        long confirmedThisMonth,
        long rejectedThisMonth,
        Instant lastSyncAt
) {
}
