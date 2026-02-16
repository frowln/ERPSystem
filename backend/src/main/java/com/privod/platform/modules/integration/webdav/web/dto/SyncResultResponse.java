package com.privod.platform.modules.integration.webdav.web.dto;

import java.time.Instant;
import java.util.List;

public record SyncResultResponse(
        boolean success,
        int totalFiles,
        int syncedFiles,
        int failedFiles,
        List<String> errors,
        Instant startedAt,
        Instant completedAt,
        long durationMs
) {
}
