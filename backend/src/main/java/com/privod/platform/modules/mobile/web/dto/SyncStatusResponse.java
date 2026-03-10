package com.privod.platform.modules.mobile.web.dto;

import java.time.Instant;

public record SyncStatusResponse(
        long pendingReports,
        long pendingPhotos,
        Instant lastSyncAt,
        boolean isOnline,
        boolean syncInProgress,
        long failedItems
) {
}
