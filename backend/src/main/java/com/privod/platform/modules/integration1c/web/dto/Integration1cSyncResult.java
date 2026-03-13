package com.privod.platform.modules.integration1c.web.dto;

import java.util.UUID;

public record Integration1cSyncResult(
        UUID syncLogId,
        boolean success,
        String message,
        int recordsProcessed,
        int recordsErrored
) {
    public static Integration1cSyncResult success(UUID syncLogId, String message, int recordsProcessed) {
        return new Integration1cSyncResult(syncLogId, true, message, recordsProcessed, 0);
    }

    public static Integration1cSyncResult failure(UUID syncLogId, String message) {
        return new Integration1cSyncResult(syncLogId, false, message, 0, 0);
    }
}
